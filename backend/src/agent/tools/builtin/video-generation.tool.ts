import { storageService } from '@/services/storage.service'
import { z } from 'zod'

const SUPPORTED_RESOLUTIONS = ['720p', '1080p'] as const
const SUPPORTED_ASPECT_RATIOS = ['16:9', '9:16'] as const

const INITIAL_POLL_INTERVAL_MS = 5000
const MAX_POLL_INTERVAL_MS = 30000
const MAX_WAIT_TIME_MS = 900000 // 15分钟

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Google 视频生成工具
 *
 * 使用 Google Veo 模型生成视频
 * 需要配置 GOOGLE_API_KEY 环境变量
 */
export const videoGenerationTool = {
  description: '使用 Google Veo 生成视频，返回可播放的视频数据',

  schema: z.object({
    prompt: z.string().describe('视频描述提示词，请详细描述想要生成的视频内容'),
    duration: z.number().min(5).max(60).optional().default(8).describe('视频时长(秒)，范围 5-60'),
    resolution: z
      .enum(SUPPORTED_RESOLUTIONS)
      .optional()
      .default('720p')
      .describe('视频分辨率，可选值：720p, 1080p'),
    aspectRatio: z
      .enum(SUPPORTED_ASPECT_RATIOS)
      .optional()
      .default('16:9')
      .describe('视频宽高比，可选值：16:9, 9:16'),
    numberOfVideos: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .default(1)
      .describe('生成视频数量，范围 1-4'),
    negativePrompt: z.string().optional().describe('排除内容的提示词'),
  }),

  handler: async (params: {
    prompt: string
    duration?: number
    resolution?: (typeof SUPPORTED_RESOLUTIONS)[number]
    aspectRatio?: (typeof SUPPORTED_ASPECT_RATIOS)[number]
    numberOfVideos?: number
    negativePrompt?: string
  }): Promise<string> => {
    const {
      prompt,
      duration = 8,
      resolution = '720p',
      aspectRatio = '16:9',
      numberOfVideos = 1,
      negativePrompt,
    } = params

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return '错误：未配置 GOOGLE_API_KEY 环境变量'
    }

    try {
      // 动态导入 Google GenAI SDK
      const { GoogleGenAI } = await import('@google/genai')
      const client = new GoogleGenAI({ apiKey })

      console.log('[VideoGeneration] Starting:', {
        prompt: prompt.substring(0, 100),
        duration,
        resolution,
        aspectRatio,
        numberOfVideos,
      })

      interface VideoConfig {
        numberOfVideos: number
        aspectRatio: string
        resolution: string
        durationSeconds?: number
        negativePrompt?: string
      }

      const config: VideoConfig = {
        numberOfVideos,
        aspectRatio,
        resolution,
      }

      if (duration) {
        config.durationSeconds = duration
      }

      if (negativePrompt) {
        config.negativePrompt = negativePrompt
      }

      // 启动视频生成任务
      let operation = await client.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt,
        config,
      })

      if (!operation) {
        return '错误：视频生成请求失败，未返回操作对象'
      }

      console.log('[VideoGeneration] Polling for completion...')

      // 轮询等待视频生成完成
      let pollInterval = INITIAL_POLL_INTERVAL_MS
      const startTime = Date.now()

      while (!operation.done) {
        const elapsed = Date.now() - startTime

        if (elapsed > MAX_WAIT_TIME_MS) {
          console.error('[VideoGeneration] Timeout')
          return '错误：视频生成超时，请稍后重试'
        }

        console.log(`[VideoGeneration] Polling... elapsed: ${Math.round(elapsed / 1000)}s`)

        await sleep(pollInterval)
        operation = await client.operations.getVideosOperation({ operation })
        pollInterval = Math.min(pollInterval * 2, MAX_POLL_INTERVAL_MS)
      }

      console.log('[VideoGeneration] Completed')

      if (operation.error) {
        console.error('[VideoGeneration] Error:', operation.error)
        const opError = operation.error as { message?: unknown }
        const errorMsg = typeof opError.message === 'string' ? opError.message : '未知错误'
        return `错误：视频生成失败 - ${errorMsg}`
      }

      interface GeneratedVideo {
        video?: { uri?: string }
      }

      interface VideoResponse {
        raiMediaFilteredCount?: number
        raiMediaFilteredReasons?: Array<{ details?: string; category?: string }>
        generatedVideos?: GeneratedVideo[]
      }

      const response = operation.response as VideoResponse | undefined
      if (!response) {
        return '错误：视频生成响应为空'
      }

      // 检查内容安全过滤
      if (response.raiMediaFilteredCount && response.raiMediaFilteredCount > 0) {
        const reasons =
          response.raiMediaFilteredReasons?.map((r) => r.details || r.category).join(', ') ||
          '内容不符合安全准则'
        console.warn('[VideoGeneration] RAI filtered:', reasons)
        return `错误：视频被安全过滤 - ${reasons}`
      }

      const generatedVideos = response.generatedVideos
      if (!generatedVideos || generatedVideos.length === 0) {
        return '错误：未生成任何视频'
      }

      console.log(`[VideoGeneration] Generated ${generatedVideos.length} video(s)`)

      // 处理生成的视频
      const videoCards: string[] = []

      for (let i = 0; i < generatedVideos.length; i++) {
        const videoData = generatedVideos[i]
        const videoUri = videoData.video?.uri

        if (!videoUri) {
          console.warn(`[VideoGeneration] Video ${i} has no URI`)
          continue
        }

        try {
          // 下载视频数据
          const videoResponse = await fetch(`${videoUri}&key=${apiKey}`)
          if (!videoResponse.ok) {
            console.error(
              `[VideoGeneration] Failed to download video ${i}:`,
              videoResponse.statusText,
            )
            continue
          }

          const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
          const fileName = `generated_video_${Date.now()}_${i}.mp4`

          // 尝试上传到 Supabase Storage
          let videoUrl: string
          if (storageService.isAvailable()) {
            const uploadResult = await storageService.uploadVideo(
              videoBuffer,
              fileName,
              'video/mp4',
            )
            if (uploadResult.success && uploadResult.url) {
              videoUrl = uploadResult.url
              console.log(`[VideoGeneration] Uploaded video ${i} to storage:`, videoUrl)
            } else {
              // 上传失败，回退到 base64
              console.warn(
                `[VideoGeneration] Storage upload failed for video ${i}, falling back to base64`,
              )
              videoUrl = `data:video/mp4;base64,${videoBuffer.toString('base64')}`
            }
          } else {
            // Storage 不可用，使用 base64
            videoUrl = `data:video/mp4;base64,${videoBuffer.toString('base64')}`
          }

          const videoCard = `<videocard status="ready" src="${videoUrl}" duration="${duration}" resolution="${resolution}"></videocard>`
          videoCards.push(videoCard)

          console.log(`[VideoGeneration] Video ${i} processed successfully`)
        } catch (downloadError) {
          console.error(`[VideoGeneration] Error processing video ${i}:`, downloadError)
        }
      }

      if (videoCards.length === 0) {
        return '错误：所有视频处理失败'
      }

      return `视频已生成完成：

${videoCards.join('\n\n')}`
    } catch (error) {
      console.error('[VideoGeneration] Error:', error)
      return `错误：视频生成失败 - ${error instanceof Error ? error.message : String(error)}`
    }
  },
}

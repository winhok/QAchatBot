import { storageService } from '@/services/storage.service'
import { z } from 'zod'

const SUPPORTED_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const
const SUPPORTED_IMAGE_SIZES = ['1K', '2K', '4K'] as const

/**
 * Google 图片生成工具
 *
 * 使用 Google Gemini 的图片生成能力
 * 需要配置 GOOGLE_API_KEY 环境变量
 * 可选：配置 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 上传到对象存储
 */
export const imageGenerationTool = {
  description: '使用 Google Gemini 生成图片',

  schema: z.object({
    prompt: z.string().describe('图片描述提示词，请详细描述想要生成的图片内容'),
    aspectRatio: z
      .enum(SUPPORTED_ASPECT_RATIOS)
      .optional()
      .default('1:1')
      .describe('图片宽高比，可选值：1:1, 16:9, 9:16, 4:3, 3:4'),
    imageSize: z
      .enum(SUPPORTED_IMAGE_SIZES)
      .optional()
      .default('1K')
      .describe('图片分辨率，可选值：1K, 2K, 4K'),
  }),

  handler: async (params: {
    prompt: string
    aspectRatio?: (typeof SUPPORTED_ASPECT_RATIOS)[number]
    imageSize?: (typeof SUPPORTED_IMAGE_SIZES)[number]
  }): Promise<string> => {
    const { prompt, aspectRatio = '1:1', imageSize = '1K' } = params

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return '错误：未配置 GOOGLE_API_KEY 环境变量'
    }

    try {
      // 动态导入 Google GenAI SDK
      const { GoogleGenAI } = await import('@google/genai')
      const client = new GoogleGenAI({ apiKey })

      console.log('[ImageGeneration] Generating image:', {
        prompt: prompt.substring(0, 50) + '...',
        aspectRatio,
        imageSize,
      })

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      })

      const candidates = response.candidates
      if (!candidates || candidates.length === 0) {
        return '错误：未生成任何图片'
      }

      const parts = candidates[0].content?.parts
      if (!parts) {
        return '错误：响应中无内容'
      }

      for (const part of parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png'
          const base64Data = part.inlineData.data as string
          const extension = mimeType.split('/')[1] || 'png'
          const fileName = `generated_${Date.now()}.${extension}`

          // 尝试上传到 Supabase Storage
          let imageUrl: string
          if (storageService.isAvailable()) {
            const imageBuffer = Buffer.from(base64Data, 'base64')
            const uploadResult = await storageService.uploadImage(imageBuffer, fileName, mimeType)

            if (uploadResult.success && uploadResult.url) {
              imageUrl = uploadResult.url
              console.log('[ImageGeneration] Uploaded to storage:', imageUrl)
            } else {
              // 上传失败，回退到 base64
              console.warn('[ImageGeneration] Storage upload failed, falling back to base64')
              imageUrl = `data:${mimeType};base64,${base64Data}`
            }
          } else {
            // Storage 不可用，使用 base64
            imageUrl = `data:${mimeType};base64,${base64Data}`
          }

          console.log('[ImageGeneration] Image generated successfully')

          // 返回包含图片展示组件的格式化结果
          return `图片已生成，请在回复中直接展示以下组件：

<imagecard status="ready" src="${imageUrl}" prompt="${prompt}" aspectRatio="${aspectRatio}"></imagecard>`
        }
      }

      return '错误：响应中未包含图片数据'
    } catch (error) {
      console.error('[ImageGeneration] Error:', error)
      return `错误：图片生成失败 - ${error instanceof Error ? error.message : String(error)}`
    }
  },
}

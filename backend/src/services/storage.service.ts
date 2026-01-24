import { createClient } from '@supabase/supabase-js'

const IMAGE_BUCKET = 'generated-images'
const VIDEO_BUCKET = 'generated-videos'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Storage Service
 *
 * 使用 Supabase Storage 存储 AI 生成的图片和视频
 * 返回公开 URL，支持 CDN 缓存
 */
class StorageService {
  private supabase: ReturnType<typeof createClient> | null = null

  private getClient(): ReturnType<typeof createClient> {
    if (!this.supabase) {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未配置')
      }

      this.supabase = createClient(supabaseUrl, supabaseKey)
    }

    return this.supabase
  }

  private async uploadToStorage(
    bucket: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    try {
      const client = this.getClient()
      const timestampedPath = `${Date.now()}-${fileName}`

      const { error: uploadError } = await client.storage
        .from(bucket)
        .upload(timestampedPath, buffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadError) {
        console.error('[StorageService] Upload failed:', uploadError)
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        }
      }

      const { data: urlData } = client.storage.from(bucket).getPublicUrl(timestampedPath)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error('[StorageService] Unexpected error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async uploadImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string = 'image/png',
  ): Promise<UploadResult> {
    return this.uploadToStorage(IMAGE_BUCKET, buffer, fileName, mimeType)
  }

  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    mimeType: string = 'video/mp4',
  ): Promise<UploadResult> {
    return this.uploadToStorage(VIDEO_BUCKET, buffer, fileName, mimeType)
  }

  /**
   * 检查 Storage 服务是否可用
   */
  isAvailable(): boolean {
    try {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      return !!(supabaseUrl && supabaseKey)
    } catch {
      return false
    }
  }
}

export const storageService = new StorageService()

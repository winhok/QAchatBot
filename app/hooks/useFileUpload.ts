/**
 * File upload strategy hook
 * Phase 2.3: File upload strategy logic [P1-High]
 */

import { useState } from 'react'

// TODO: Define MessageContentBlock type or import from schemas
interface MessageContentBlock {
  type: string
  // TODO: Add proper type definitions
}

interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<MessageContentBlock>
  uploading: boolean
  progress: number
  error: string | null
}

/**
 * Hook for handling file uploads with strategy selection
 *
 * TODO: Implement the following features:
 * - [ ] Choose upload strategy based on file type and size
 * - [ ] Small images (< 5MB): Base64 encoding
 * - [ ] Large images (>= 5MB): Reserve OSS upload interface
 * - [ ] Video/Audio/PDF: Reserve OSS upload interface (show not supported message for now)
 * - [ ] Return standardized content block format
 *
 * Acceptance criteria:
 * - Small images can be converted to Base64 content blocks
 * - Large files show friendly prompt
 */
export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<MessageContentBlock> => {
    // TODO: Implement upload strategy logic
    // 1. Check file type (image, video, audio, pdf)
    // 2. Check file size
    // 3. For small images (< 5MB): use Base64 encoding
    // 4. For large files: prepare OSS upload (currently show not supported)
    // 5. Return content block in correct format

    throw new Error('Not implemented')
  }

  return {
    uploadFile,
    uploading,
    progress,
    error,
  }
}

// TODO: Phase 3.2 - Implement uploadToOSS(file: File): Promise<string>
// - [ ] Support upload progress callback
// - [ ] Implement retry mechanism (max 3 times)
// - [ ] Error handling

export async function uploadToOSS(file: File): Promise<string> {
  // TODO: Implement OSS upload logic
  throw new Error('Not implemented')
}

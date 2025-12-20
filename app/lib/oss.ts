/**
 * OSS (Object Storage Service) configuration and client
 * Phase 3.1: Configure OSS service [P2-Medium]
 */

/**
 * Environment variables required:
 * - OSS_ACCESS_KEY_ID=
 * - OSS_ACCESS_KEY_SECRET=
 * - OSS_BUCKET_NAME=
 * - OSS_REGION=
 */

// TODO: Choose OSS provider (Alibaba Cloud OSS / AWS S3 / Google Cloud Storage)

// TODO: Configure environment variables
// Add to .env:
// OSS_ACCESS_KEY_ID=
// OSS_ACCESS_KEY_SECRET=
// OSS_BUCKET_NAME=
// OSS_REGION=

// TODO: Implement OSS client initialization
export function initOSSClient() {
  // TODO: Initialize OSS client based on chosen provider
  throw new Error('Not implemented')
}

// TODO: Implement file upload function
export async function uploadFile(file: File | Buffer, filename: string): Promise<string> {
  // TODO: Upload file to OSS and return URL
  throw new Error('Not implemented')
}

// TODO: Implement signed URL generation (optional, for private access)
export async function generateSignedUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
  // TODO: Generate signed URL for private file access
  throw new Error('Not implemented')
}

/**
 * Phase 3.3: Support video/audio/PDF upload [P2-Medium]
 *
 * TODO:
 * - [ ] Video file handling: upload to OSS, return `media` type content block
 * - [ ] Audio file handling: upload to OSS, return `media` type content block
 * - [ ] PDF file handling: upload to OSS, return `document` type content block
 * - [ ] Video thumbnail extraction (optional)
 */

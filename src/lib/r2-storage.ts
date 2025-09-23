import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export interface UploadOptions {
  buffer: Buffer
  filename: string
  mimetype: string
  folder?: string
}

export async function uploadToR2(options: UploadOptions): Promise<string> {
  const { buffer, filename, mimetype, folder = "post-media" } = options

  const timestamp = Date.now()
  const fileExtension = filename.split(".").pop()
  const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
  const key = `${folder}/${uniqueFilename}`

  console.log("=== R2 UPLOAD DEBUG ===")
  console.log("Uploading to key:", key)
  console.log("File size:", buffer.length)
  console.log("MIME type:", mimetype)
  console.log("Bucket:", process.env.R2_BUCKET_NAME)

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // Note: Cloudflare R2 doesn't use ACL like AWS S3
      // Public access is configured at the bucket level
    })

    await r2Client.send(command)

    // Construct the public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    console.log("R2 upload successful:", publicUrl)
    console.log("=== R2 UPLOAD COMPLETE ===")

    return publicUrl
  } catch (error) {
    console.error("=== R2 UPLOAD ERROR ===")
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    console.error("Upload parameters:", {
      key,
      bufferSize: buffer.length,
      mimetype,
      bucket: process.env.R2_BUCKET_NAME,
      hasCredentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
    })
    throw error
  }
}

// Utility function to delete files from R2 (optional)
export async function deleteFromR2(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1) // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })

    await r2Client.send(command)
    console.log("File deleted from R2:", key)
  } catch (error) {
    console.error("Failed to delete from R2:", error)
    throw error
  }
}
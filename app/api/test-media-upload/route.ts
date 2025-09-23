import { NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/src/lib/r2-storage"

export async function POST(request: NextRequest) {
  try {
    console.log("=== TEST MEDIA UPLOAD START ===")
    
    const formData = await request.formData()
    const media = formData.get("media") as File | null
    
    if (!media) {
      return NextResponse.json({ error: "No media file provided" }, { status: 400 })
    }
    
    console.log("Media received:", {
      name: media.name,
      size: media.size,
      type: media.type,
      isFile: media instanceof File
    })
    
    // Convert to buffer
    const bytes = await media.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log("Buffer created:", {
      size: buffer.length,
      isBuffer: buffer instanceof Buffer
    })
    
    // Upload to Cloudflare R2
    console.log("Uploading to R2...")
    
    const fileUrl = await uploadToR2({
      buffer,
      filename: media.name,
      mimetype: media.type,
      folder: "test-uploads",
    })
    
    console.log("Upload successful:", fileUrl)
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      originalName: media.name,
      size: media.size,
      type: media.type
    })
    
  } catch (error) {
    console.error("Test upload failed:", error)
    return NextResponse.json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
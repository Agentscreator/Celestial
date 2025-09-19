import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

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
    
    // Upload to blob
    const timestamp = Date.now()
    const fileExtension = media.name.split(".").pop()
    const uniqueFilename = `test-${timestamp}.${fileExtension}`
    const pathname = `test-uploads/${uniqueFilename}`
    
    console.log("Uploading to:", pathname)
    
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: media.type,
    })
    
    console.log("Upload successful:", blob.url)
    
    return NextResponse.json({
      success: true,
      url: blob.url,
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
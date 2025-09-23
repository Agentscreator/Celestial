import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { uploadToR2 } from "@/src/lib/r2-storage"

export async function POST(request: NextRequest) {
  try {
    console.log("=== MESSAGE UPLOAD API START ===")
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized: No session or user ID")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session valid, user ID:", session.user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    console.log("📁 File received:", {
      name: file?.name,
      type: file?.type,
      size: file?.size
    })
    
    if (!file) {
      console.log("❌ No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.log("❌ File too large:", file.size, "bytes")
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      console.log("❌ File type not allowed:", file.type)
      return NextResponse.json({ 
        error: `File type '${file.type}' not allowed. Supported types: images, audio, video, PDF, text, and Office documents.` 
      }, { status: 400 })
    }

    console.log("✅ File validation passed")

    // Upload to Cloudflare R2
    console.log("💾 Uploading to Cloudflare R2...")
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileUrl = await uploadToR2({
      buffer,
      filename: file.name,
      mimetype: file.type,
      folder: "messages",
    })
    
    console.log("✅ File uploaded successfully to R2 storage")
    console.log("🔗 R2 URL:", fileUrl)
    
    const response = {
      url: fileUrl,
      name: file.name,
      type: file.type,
      size: file.size,
      success: true
    }

    console.log("✅ Upload successful:", response)
    console.log("=== MESSAGE UPLOAD API END ===")
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error uploading file:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
    console.log("=== MESSAGE UPLOAD API END (ERROR) ===")
    return NextResponse.json({ 
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
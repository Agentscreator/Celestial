import { NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/src/lib/r2-storage"

export async function GET() {
  try {
    console.log("🧪 Testing R2 connection...")

    // Check environment variables
    const requiredEnvVars = [
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID', 
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'R2_PUBLIC_URL'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        missing: missingVars,
        message: "Please configure all R2 environment variables"
      }, { status: 400 })
    }

    console.log("✅ All environment variables present")

    return NextResponse.json({
      success: true,
      message: "R2 configuration looks good",
      config: {
        endpoint: process.env.R2_ENDPOINT,
        bucket: process.env.R2_BUCKET_NAME,
        publicUrl: process.env.R2_PUBLIC_URL,
        hasCredentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
      }
    })

  } catch (error) {
    console.error("❌ R2 connection test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: "R2 connection test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("🧪 Testing R2 upload...")

    // Create a small test file
    const testContent = `R2 Upload Test - ${new Date().toISOString()}`
    const buffer = Buffer.from(testContent, 'utf-8')

    // Upload test file
    const url = await uploadToR2({
      buffer,
      filename: 'test.txt',
      mimetype: 'text/plain',
      folder: 'test'
    })

    console.log("✅ R2 upload test successful:", url)

    return NextResponse.json({
      success: true,
      message: "R2 upload test successful",
      testFileUrl: url
    })

  } catch (error) {
    console.error("❌ R2 upload test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: "R2 upload test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"

// Very simple test endpoint to isolate issues
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 SIMPLE TEST API - Starting...")
    
    // Test 1: Basic response
    console.log("✅ Basic response test passed")
    
    // Test 2: Session check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "No session" }, { status: 401 })
    }
    console.log("✅ Session test passed:", session.user.id)
    
    // Test 3: Form data parsing
    const formData = await request.formData()
    const content = formData.get("content") as string
    console.log("✅ Form data test passed:", content)
    
    // Test 4: JSON response
    return NextResponse.json({
      success: true,
      message: "Simple test passed",
      content: content,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ SIMPLE TEST ERROR:", error)
    return NextResponse.json({ 
      error: "Simple test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
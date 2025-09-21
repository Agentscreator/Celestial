import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  console.log("🔧 SIMPLE POSTS API - Starting...")

  try {
    // 1. Check session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("❌ No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session OK:", session.user.id)

    // 2. Parse request body (JSON instead of FormData for simplicity)
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      console.error("❌ No content provided")
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    console.log("✅ Content:", content.substring(0, 50))

    // 3. Insert into database with minimal data
    console.log("📝 Inserting into database...")
    
    const postData = {
      userId: session.user.id,
      content: content.trim(),
      hasPrivateLocation: 0, // Ensure this is set
    }

    console.log("Post data:", postData)

    const result = await db
      .insert(postsTable)
      .values(postData)
      .returning()

    console.log("✅ Database insert successful:", result[0]?.id)

    // 4. Verify the post was saved
    const verification = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, result[0].id))
      .limit(1)

    if (verification.length === 0) {
      console.error("❌ Post not found after insert")
      return NextResponse.json({ error: "Post creation failed - not persisted" }, { status: 500 })
    }

    console.log("✅ Post verification successful")

    return NextResponse.json({
      success: true,
      post: result[0],
      message: "Simple post created successfully"
    })

  } catch (error) {
    console.error("❌ Simple posts API error:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack"
    })

    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
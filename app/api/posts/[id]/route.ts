import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable, usersTable } from "@/src/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { postCommentsTable, postLikesTable, postInvitesTable } from "@/src/db/schema"
import { uploadToR2 } from "@/src/lib/r2-storage"


// GET - Fetch a single post
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const postId = Number.parseInt(id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Get the post with user information and stats
    const post = await db
      .select({
        id: postsTable.id,
        content: postsTable.content,
        image: postsTable.image,
        video: postsTable.video,
        duration: postsTable.duration,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        userId: postsTable.userId,
        likes: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${postLikesTable} 
          WHERE ${postLikesTable.postId} = ${postsTable.id}
        )`,
        comments: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${postCommentsTable} 
          WHERE ${postCommentsTable.postId} = ${postsTable.id}
        )`,
      })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1)

    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get user information for the post
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
        image: usersTable.image,
      })
      .from(usersTable)
      .where(eq(usersTable.id, post[0].userId))
      .limit(1)

    // Check if current user liked this post (if authenticated)
    const session = await getServerSession(authOptions)
    let isLiked = false
    if (session?.user?.id) {
      const likeCheck = await db
        .select()
        .from(postLikesTable)
        .where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, session.user.id)))
        .limit(1)
      isLiked = likeCheck.length > 0
    }

    const postWithUser = {
      ...post[0],
      user: user[0] || null,
      isLiked,
    }

    return NextResponse.json(postWithUser)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function uploadToStorage(options: {
  buffer: Buffer
  filename: string
  mimetype: string
  folder?: string
}): Promise<string> {
  const { buffer, filename, mimetype, folder = "post-media" } = options

  const timestamp = Date.now()
  const fileExtension = filename.split(".").pop()
  const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
  const pathname = `${folder}/${uniqueFilename}`

  const imageUrl = await uploadToR2({
    buffer,
    filename: uniqueFilename,
    mimetype,
    folder,
  })

  return imageUrl
}

// PUT - Edit a post
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== EDIT POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Check if post exists and belongs to the user
    const post = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))
      .limit(1)

    if (post.length === 0) {
      console.error("Post not found or not owned by user")
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const media = formData.get("media") as File | null
    const removeMedia = formData.get("removeMedia") === "true"

    console.log("Edit data:", { content, hasMedia: !!media, removeMedia })

    if (!content?.trim() && !media && !post[0].image && !post[0].video) {
      console.error("No content or media provided")
      return NextResponse.json({ error: "Content or media is required" }, { status: 400 })
    }

    const updateData: any = {
      content: content?.trim() || "",
      updatedAt: new Date(),
    }

    // Handle media updates
    if (removeMedia) {
      updateData.image = null
      updateData.video = null
    } else if (media) {
      // Validate file type
      if (!media.type.startsWith("image/") && !media.type.startsWith("video/")) {
        return NextResponse.json({ error: "File must be an image or video" }, { status: 400 })
      }

      // Validate file size
      const maxSize = media.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (media.size > maxSize) {
        return NextResponse.json(
          {
            error: `File too large (max ${media.type.startsWith("video/") ? "50MB for videos" : "10MB for images"})`,
          },
          { status: 400 },
        )
      }

      try {
        const bytes = await media.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const mediaUrl = await uploadToStorage({
          buffer,
          filename: media.name,
          mimetype: media.type,
          folder: "post-media",
        })

        if (media.type.startsWith("video/")) {
          updateData.video = mediaUrl
          updateData.image = null
        } else {
          updateData.image = mediaUrl
          updateData.video = null
        }
      } catch (uploadError) {
        console.error("Media upload failed:", uploadError)
        return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
      }
    }

    // Update the post
    const updatedPost = await db
      .update(postsTable)
      .set(updateData)
      .where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))
      .returning()

    console.log("✅ Post updated successfully")
    return NextResponse.json(updatedPost[0])
  } catch (error) {
    console.error("❌ Edit post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== DELETE POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Deleting post ID:", postId)
    console.log("User ID:", session.user.id)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // First check if post exists at all
    console.log("Checking if post exists...")
    const postExists = await db
      .select({ id: postsTable.id, userId: postsTable.userId })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1)

    if (postExists.length === 0) {
      console.error("Post not found in database")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    console.log("Post exists, owner:", postExists[0].userId)

    // Check if user owns the post
    if (postExists[0].userId !== session.user.id) {
      console.error("User does not own this post")
      return NextResponse.json({ error: "Unauthorized - you don't own this post" }, { status: 403 })
    }

    console.log("User owns post, proceeding with deletion")

    try {
      // Delete associated data first (with individual error handling)
      console.log("Deleting associated comments...")
      const commentsDeleted = await db.delete(postCommentsTable).where(eq(postCommentsTable.postId, postId))
      console.log("Comments deleted:", commentsDeleted)

      console.log("Deleting associated likes...")
      const likesDeleted = await db.delete(postLikesTable).where(eq(postLikesTable.postId, postId))
      console.log("Likes deleted:", likesDeleted)

      console.log("Deleting associated invites...")
      const invitesDeleted = await db.delete(postInvitesTable).where(eq(postInvitesTable.postId, postId))
      console.log("Invites deleted:", invitesDeleted)

      // Delete the post
      console.log("Deleting the post...")
      const postDeleted = await db.delete(postsTable).where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))
      console.log("Post deleted:", postDeleted)

      console.log("✅ Post deleted successfully")
      return NextResponse.json({
        message: "Post deleted successfully",
        deletedCounts: {
          comments: commentsDeleted,
          likes: likesDeleted,
          invites: invitesDeleted,
          post: postDeleted
        }
      })
    } catch (dbError) {
      console.error("❌ Database deletion error:", dbError)
      console.error("Error details:", {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      })
      return NextResponse.json({
        error: "Failed to delete post from database",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Delete post error:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventVideosTable, eventParticipantsTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// GET - Get specific video details
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.eventId)
    const videoId = parseInt(params.videoId)

    if (isNaN(eventId) || isNaN(videoId)) {
      return NextResponse.json({ error: "Invalid event or video ID" }, { status: 400 })
    }

    // Check if user has access to this event
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check access permissions
    const [userParticipation] = await db
      .select()
      .from(eventParticipantsTable)
      .where(
        and(
          eq(eventParticipantsTable.eventId, eventId),
          eq(eventParticipantsTable.userId, session.user.id)
        )
      )
      .limit(1)

    const isCreator = event.createdBy === session.user.id
    const isParticipant = userParticipation !== undefined

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get the video
    const [video] = await db
      .select()
      .from(eventVideosTable)
      .where(
        and(
          eq(eventVideosTable.id, videoId),
          eq(eventVideosTable.eventId, eventId)
        )
      )
      .limit(1)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if user can see this video
    if (video.isPublic === 0 && video.uploadedBy !== session.user.id && !isCreator) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({
      video: {
        ...video,
        canEdit: video.uploadedBy === session.user.id || isCreator,
        canDelete: video.uploadedBy === session.user.id || isCreator,
      }
    })

  } catch (error) {
    console.error("Event video GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update video details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.eventId)
    const videoId = parseInt(params.videoId)

    if (isNaN(eventId) || isNaN(videoId)) {
      return NextResponse.json({ error: "Invalid event or video ID" }, { status: 400 })
    }

    // Check if user has access to this event
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the video and check permissions
    const [video] = await db
      .select()
      .from(eventVideosTable)
      .where(
        and(
          eq(eventVideosTable.id, videoId),
          eq(eventVideosTable.eventId, eventId)
        )
      )
      .limit(1)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const isCreator = event.createdBy === session.user.id
    const isOwner = video.uploadedBy === session.user.id

    if (!isOwner && !isCreator) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, isPublic } = body

    // Build update object with only provided fields
    const updateData: any = {}

    if (title !== undefined) {
      updateData.title = title?.trim() || null
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic ? 1 : 0
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Update the video
    const [updatedVideo] = await db
      .update(eventVideosTable)
      .set(updateData)
      .where(eq(eventVideosTable.id, videoId))
      .returning()

    return NextResponse.json({
      video: {
        ...updatedVideo,
        canEdit: true,
        canDelete: true,
      }
    })

  } catch (error) {
    console.error("Event video update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.eventId)
    const videoId = parseInt(params.videoId)

    if (isNaN(eventId) || isNaN(videoId)) {
      return NextResponse.json({ error: "Invalid event or video ID" }, { status: 400 })
    }

    // Check if user has access to this event
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the video and check permissions
    const [video] = await db
      .select()
      .from(eventVideosTable)
      .where(
        and(
          eq(eventVideosTable.id, videoId),
          eq(eventVideosTable.eventId, eventId)
        )
      )
      .limit(1)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const isCreator = event.createdBy === session.user.id
    const isOwner = video.uploadedBy === session.user.id

    if (!isOwner && !isCreator) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Delete the video
    await db
      .delete(eventVideosTable)
      .where(eq(eventVideosTable.id, videoId))

    return NextResponse.json({ message: "Video deleted successfully" })

  } catch (error) {
    console.error("Event video delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
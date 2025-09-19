import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventVideosTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// PUT - Set event thumbnail video
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.eventId)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const body = await request.json()
    const { videoId } = body

    // Verify the event exists and user is the creator
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Only event creator can set thumbnail" }, { status: 403 })
    }

    let thumbnailVideoUrl = null
    let thumbnailImageUrl = null

    if (videoId) {
      // Verify the video exists and belongs to this event
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

      thumbnailVideoUrl = video.videoUrl
      thumbnailImageUrl = video.thumbnailUrl
    }

    // Update the event with the thumbnail
    const [updatedEvent] = await db
      .update(eventsTable)
      .set({
        thumbnailVideoUrl,
        thumbnailImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(eventsTable.id, eventId))
      .returning()

    return NextResponse.json({
      message: videoId ? "Event thumbnail set successfully" : "Event thumbnail removed successfully",
      event: {
        id: updatedEvent.id.toString(),
        thumbnailVideoUrl: updatedEvent.thumbnailVideoUrl,
        thumbnailImageUrl: updatedEvent.thumbnailImageUrl,
      }
    })
  } catch (error) {
    console.error("Set thumbnail error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove event thumbnail
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.eventId)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Verify the event exists and user is the creator
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Only event creator can remove thumbnail" }, { status: 403 })
    }

    // Remove the thumbnail
    const [updatedEvent] = await db
      .update(eventsTable)
      .set({
        thumbnailVideoUrl: null,
        thumbnailImageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(eventsTable.id, eventId))
      .returning()

    return NextResponse.json({
      message: "Event thumbnail removed successfully",
      event: {
        id: updatedEvent.id.toString(),
        thumbnailVideoUrl: updatedEvent.thumbnailVideoUrl,
        thumbnailImageUrl: updatedEvent.thumbnailImageUrl,
      }
    })
  } catch (error) {
    console.error("Remove thumbnail error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
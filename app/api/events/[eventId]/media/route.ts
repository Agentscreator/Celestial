import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventMediaTable, eventsTable, eventParticipantsTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// POST - Add media to an event
export async function POST(
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

    // Check if event exists and user has access
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is the creator or a participant
    const isCreator = event.createdBy === session.user.id
    let isParticipant = false

    if (!isCreator) {
      const [participation] = await db
        .select()
        .from(eventParticipantsTable)
        .where(
          and(
            eq(eventParticipantsTable.eventId, eventId),
            eq(eventParticipantsTable.userId, session.user.id)
          )
        )
        .limit(1)

      isParticipant = participation !== undefined
    }

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const {
      mediaUrl,
      thumbnailUrl,
      title,
      description,
      mediaType,
      duration,
      width,
      height,
      fileSize,
      mimeType,
      isPublic = true
    } = body

    // Validation
    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ 
        error: "Media URL and type are required" 
      }, { status: 400 })
    }

    // Insert media record
    const [newMedia] = await db
      .insert(eventMediaTable)
      .values({
        eventId,
        uploadedBy: session.user.id,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || null,
        title: title || null,
        description: description || null,
        mediaType,
        duration: duration || null,
        width: width || null,
        height: height || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        isPublic: isPublic ? 1 : 0,
      })
      .returning()

    return NextResponse.json({ 
      success: true,
      media: {
        id: newMedia.id,
        mediaUrl: newMedia.mediaUrl,
        thumbnailUrl: newMedia.thumbnailUrl,
        title: newMedia.title,
        description: newMedia.description,
        mediaType: newMedia.mediaType,
        duration: newMedia.duration,
        width: newMedia.width,
        height: newMedia.height,
        fileSize: newMedia.fileSize,
        mimeType: newMedia.mimeType,
        isPublic: newMedia.isPublic === 1,
        uploadedAt: newMedia.uploadedAt,
      }
    })
  } catch (error) {
    console.error("Event media POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get media for an event
export async function GET(
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

    // Check if event exists
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user has access to view media
    const isCreator = event.createdBy === session.user.id
    let isParticipant = false

    if (!isCreator) {
      const [participation] = await db
        .select()
        .from(eventParticipantsTable)
        .where(
          and(
            eq(eventParticipantsTable.eventId, eventId),
            eq(eventParticipantsTable.userId, session.user.id)
          )
        )
        .limit(1)

      isParticipant = participation !== undefined
    }

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get media for the event
    const media = await db
      .select()
      .from(eventMediaTable)
      .where(eq(eventMediaTable.eventId, eventId))
      .orderBy(eventMediaTable.uploadedAt)

    return NextResponse.json({ 
      media: media.map(m => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        thumbnailUrl: m.thumbnailUrl,
        title: m.title,
        description: m.description,
        mediaType: m.mediaType,
        duration: m.duration,
        width: m.width,
        height: m.height,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        isPublic: m.isPublic === 1,
        uploadedAt: m.uploadedAt,
      }))
    })
  } catch (error) {
    console.error("Event media GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
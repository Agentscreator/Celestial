import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventMediaTable, eventParticipantsTable, usersTable } from "@/src/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET - Fetch event media
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

    // Check if user is a participant or event creator
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

    const isParticipant = participation !== undefined
    const isCreator = event.createdBy === session.user.id

    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch media with uploader info
    const media = await db
      .select({
        id: eventMediaTable.id,
        eventId: eventMediaTable.eventId,
        mediaUrl: eventMediaTable.mediaUrl,
        thumbnailUrl: eventMediaTable.thumbnailUrl,
        title: eventMediaTable.title,
        description: eventMediaTable.description,
        mediaType: eventMediaTable.mediaType,
        duration: eventMediaTable.duration,
        width: eventMediaTable.width,
        height: eventMediaTable.height,
        fileSize: eventMediaTable.fileSize,
        mimeType: eventMediaTable.mimeType,
        isPublic: eventMediaTable.isPublic,
        uploadedAt: eventMediaTable.uploadedAt,
        uploadedBy: eventMediaTable.uploadedBy,
        uploader: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
      })
      .from(eventMediaTable)
      .leftJoin(usersTable, eq(eventMediaTable.uploadedBy, usersTable.id))
      .where(
        and(
          eq(eventMediaTable.eventId, eventId),
          // Only show public media or media uploaded by current user
          // (unless they're the event creator, who can see all)
          isCreator
            ? undefined
            : and(
                eq(eventMediaTable.isPublic, 1),
                // Or media uploaded by the current user
                eq(eventMediaTable.uploadedBy, session.user.id)
              )
        )
      )
      .orderBy(desc(eventMediaTable.uploadedAt))

    return NextResponse.json({
      media: media.map(m => ({
        ...m,
        isPublic: m.isPublic === 1
      }))
    })
  } catch (error) {
    console.error("Get event media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Upload media to event
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
      isPublic 
    } = body

    // Validate required fields
    if (!mediaUrl || !mediaType || !mimeType) {
      return NextResponse.json({ 
        error: "Media URL, media type, and MIME type are required" 
      }, { status: 400 })
    }

    // Validate media type
    if (!['image', 'video', 'gif'].includes(mediaType)) {
      return NextResponse.json({ 
        error: "Media type must be 'image', 'video', or 'gif'" 
      }, { status: 400 })
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

    // Check if user is a participant
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

    if (!participation) {
      return NextResponse.json({ error: "You must be a participant to upload media" }, { status: 403 })
    }

    // Insert the media record
    const [newMedia] = await db
      .insert(eventMediaTable)
      .values({
        eventId,
        uploadedBy: session.user.id,
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        title: title?.trim() || null,
        description: description?.trim() || null,
        mediaType,
        duration: duration || null,
        width: width || null,
        height: height || null,
        fileSize: fileSize || null,
        mimeType: mimeType.trim(),
        isPublic: isPublic ? 1 : 0,
      })
      .returning()

    // Fetch uploader info for response
    const [uploader] = await db
      .select({
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)

    return NextResponse.json({
      media: {
        ...newMedia,
        isPublic: newMedia.isPublic === 1,
        uploader: uploader || { username: "Unknown", nickname: null, profileImage: null }
      }
    })
  } catch (error) {
    console.error("Upload media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
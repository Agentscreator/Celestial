import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventMediaTable, eventParticipantsTable, usersTable } from "@/src/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET - Fetch videos for an event
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

    // Check if user has access to this event (participant or creator)
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

    // Fetch videos with uploader information
    const videos = await db
      .select({
        id: eventMediaTable.id,
        eventId: eventMediaTable.eventId,
        videoUrl: eventMediaTable.mediaUrl,
        thumbnailUrl: eventMediaTable.thumbnailUrl,
        title: eventMediaTable.title,
        description: eventMediaTable.description,
        duration: eventMediaTable.duration,
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
          // Only show public videos or videos uploaded by current user
          // (unless they're the event creator, who can see all)
          isCreator
            ? undefined
            : and(
                eq(eventMediaTable.isPublic, 1),
                // Or videos uploaded by the current user
                eq(eventMediaTable.uploadedBy, session.user.id)
              )
        )
      )
      .orderBy(desc(eventMediaTable.uploadedAt))

    return NextResponse.json({
      videos: videos.map(video => ({
        ...video,
        canEdit: video.uploadedBy === session.user.id || isCreator,
        canDelete: video.uploadedBy === session.user.id || isCreator,
      }))
    })

  } catch (error) {
    console.error("Event videos GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Upload a new video to an event
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

    // Check if user is a participant or creator
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
      return NextResponse.json({ error: "Only event participants can upload videos" }, { status: 403 })
    }

    const body = await request.json()
    const {
      videoUrl,
      thumbnailUrl,
      title,
      description,
      duration,
      fileSize,
      mimeType = "video/mp4",
      isPublic = true
    } = body

    // Validate required fields
    if (!videoUrl?.trim()) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(videoUrl)
    } catch {
      return NextResponse.json({ error: "Invalid video URL format" }, { status: 400 })
    }

    // Validate optional thumbnail URL
    if (thumbnailUrl) {
      try {
        new URL(thumbnailUrl)
      } catch {
        return NextResponse.json({ error: "Invalid thumbnail URL format" }, { status: 400 })
      }
    }

    // Validate duration and file size if provided
    if (duration !== undefined && (typeof duration !== "number" || duration <= 0)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
    }

    if (fileSize !== undefined && (typeof fileSize !== "number" || fileSize <= 0)) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 })
    }

    // Insert the video record
    const [newVideo] = await db
      .insert(eventMediaTable)
      .values({
        eventId,
        uploadedBy: session.user.id,
        mediaUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        title: title?.trim() || null,
        description: description?.trim() || null,
        mediaType: 'video',
        duration: duration || null,
        fileSize: fileSize || null,
        mimeType: mimeType || "video/mp4",
        isPublic: isPublic ? 1 : 0,
      })
      .returning()

    // Get uploader info for response
    const [uploader] = await db
      .select({
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)

    const responseVideo = {
      ...newVideo,
      uploader,
      canEdit: true,
      canDelete: true,
    }

    return NextResponse.json({ video: responseVideo }, { status: 201 })

  } catch (error) {
    console.error("Event video upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
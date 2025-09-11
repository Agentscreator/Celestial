import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, usersTable, eventParticipantsTable } from "@/src/db/schema"
import { desc, eq, count, and, gte } from "drizzle-orm"
import { randomBytes } from "crypto"

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch events with creator info and participant counts
    const eventsWithDetails = await db
      .select({
        id: eventsTable.id,
        title: eventsTable.title,
        description: eventsTable.description,
        location: eventsTable.location,
        eventDate: eventsTable.eventDate,
        eventTime: eventsTable.eventTime,
        maxParticipants: eventsTable.maxParticipants,
        currentParticipants: eventsTable.currentParticipants,
        createdBy: eventsTable.createdBy,
        shareToken: eventsTable.shareToken,
        isActive: eventsTable.isActive,
        createdAt: eventsTable.createdAt,
        updatedAt: eventsTable.updatedAt,
        creator: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
      })
      .from(eventsTable)
      .leftJoin(usersTable, eq(eventsTable.createdBy, usersTable.id))
      .where(eq(eventsTable.isActive, 1))
      .orderBy(desc(eventsTable.createdAt))

    // Check if current user has joined each event
    const events = await Promise.all(
      eventsWithDetails.map(async (event) => {
        const [userParticipation] = await db
          .select()
          .from(eventParticipantsTable)
          .where(
            and(
              eq(eventParticipantsTable.eventId, event.id),
              eq(eventParticipantsTable.userId, session.user.id)
            )
          )
          .limit(1)

        return {
          id: event.id.toString(),
          title: event.title,
          description: event.description,
          location: event.location,
          date: event.eventDate,
          time: event.eventTime,
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants,
          createdBy: event.createdBy,
          createdByUsername: event.creator?.username || "Unknown User",
          shareUrl: `${process.env.NEXTAUTH_URL}/events/invite/${event.shareToken}`,
          hasJoined: userParticipation !== undefined,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }
      })
    )

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Events GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, location, date, time, maxParticipants } = body

    // Validation
    if (!title?.trim() || !description?.trim() || !location?.trim() || !date || !time) {
      return NextResponse.json({ 
        error: "Title, description, location, date, and time are required" 
      }, { status: 400 })
    }

    // Validate date is not in the past
    const eventDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      return NextResponse.json({ 
        error: "Event date cannot be in the past" 
      }, { status: 400 })
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex')

    // Create the event
    const [newEvent] = await db
      .insert(eventsTable)
      .values({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        eventDate: date,
        eventTime: time,
        maxParticipants: maxParticipants || null,
        currentParticipants: 1, // Creator is first participant
        createdBy: session.user.id,
        shareToken,
        isActive: 1,
      })
      .returning()

    // Add creator as first participant
    await db
      .insert(eventParticipantsTable)
      .values({
        eventId: newEvent.id,
        userId: session.user.id,
      })

    // Fetch creator info for response
    const [creator] = await db
      .select({
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)

    const responseEvent = {
      id: newEvent.id.toString(),
      title: newEvent.title,
      description: newEvent.description,
      location: newEvent.location,
      date: newEvent.eventDate,
      time: newEvent.eventTime,
      maxParticipants: newEvent.maxParticipants,
      currentParticipants: newEvent.currentParticipants,
      createdBy: newEvent.createdBy,
      createdByUsername: creator?.username || "Unknown User",
      shareUrl: `${process.env.NEXTAUTH_URL}/events/invite/${newEvent.shareToken}`,
      hasJoined: true, // Creator has joined by default
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
    }

    return NextResponse.json({ event: responseEvent })
  } catch (error) {
    console.error("Events POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
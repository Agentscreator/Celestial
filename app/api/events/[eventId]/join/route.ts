import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventParticipantsTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// POST - Join an event
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

    // Check if event exists and is active
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.isActive, 1)))
      .limit(1)

    if (!event) {
      return NextResponse.json({ error: "Event not found or inactive" }, { status: 404 })
    }

    // Check if event is full
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Check if user is already a participant
    const [existingParticipation] = await db
      .select()
      .from(eventParticipantsTable)
      .where(
        and(
          eq(eventParticipantsTable.eventId, eventId),
          eq(eventParticipantsTable.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingParticipation) {
      return NextResponse.json({ error: "Already joined this event" }, { status: 400 })
    }

    // Add participant
    await db
      .insert(eventParticipantsTable)
      .values({
        eventId,
        userId: session.user.id,
      })

    // Update participant count
    await db
      .update(eventsTable)
      .set({ currentParticipants: event.currentParticipants + 1 })
      .where(eq(eventsTable.id, eventId))

    return NextResponse.json({ 
      message: "Successfully joined event",
      currentParticipants: event.currentParticipants + 1
    })
  } catch (error) {
    console.error("Event join error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Leave an event
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
      return NextResponse.json({ error: "Not a participant of this event" }, { status: 400 })
    }

    // Remove participant
    await db
      .delete(eventParticipantsTable)
      .where(
        and(
          eq(eventParticipantsTable.eventId, eventId),
          eq(eventParticipantsTable.userId, session.user.id)
        )
      )

    // Update participant count
    await db
      .update(eventsTable)
      .set({ currentParticipants: Math.max(0, event.currentParticipants - 1) })
      .where(eq(eventsTable.id, eventId))

    return NextResponse.json({ 
      message: "Successfully left event",
      currentParticipants: Math.max(0, event.currentParticipants - 1)
    })
  } catch (error) {
    console.error("Event leave error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
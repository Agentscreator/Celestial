import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, eventParticipantsTable, groupsTable, groupMembersTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// POST - Join an event
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('🚀 Join Event POST:', { params, eventId: params?.eventId })

    const session = await getServerSession(authOptions)
    console.log('🔐 Session check:', { hasSession: !!session, userId: session?.user?.id })

    if (!session?.user?.id) {
      console.log('❌ Unauthorized: No session or user ID')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('📝 Parsing eventId:', params.eventId)
    const eventId = parseInt(params.eventId)
    if (isNaN(eventId)) {
      console.log('❌ Invalid event ID:', params.eventId)
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    console.log('✅ Valid eventId:', eventId)

    // Check if event exists and is active
    console.log('🔍 Searching for event with ID:', eventId)
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.isActive, 1)))
      .limit(1)

    console.log('🎯 Event found:', !!event, event ? { id: event.id, title: event.title, isActive: event.isActive } : 'No event found')

    if (!event) {
      console.log('❌ Event not found or inactive for ID:', eventId)

      // Also check if event exists but is inactive for better debugging
      const [inactiveEvent] = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, eventId))
        .limit(1)

      if (inactiveEvent) {
        console.log('📝 Event exists but is inactive:', { id: inactiveEvent.id, isActive: inactiveEvent.isActive })
        return NextResponse.json({ error: "Event is no longer active" }, { status: 404 })
      } else {
        console.log('📝 No event found with this ID at all')
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
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

    // If event has a community, add user to the group
    if (event.isInvite === 1 && event.groupName) {
      // Find the group associated with this event creator and name
      const [group] = await db
        .select()
        .from(groupsTable)
        .where(
          and(
            eq(groupsTable.createdBy, event.createdBy),
            eq(groupsTable.name, event.groupName)
          )
        )
        .limit(1)

      if (group) {
        // Check if user is already a group member
        const [existingMembership] = await db
          .select()
          .from(groupMembersTable)
          .where(
            and(
              eq(groupMembersTable.groupId, group.id),
              eq(groupMembersTable.userId, session.user.id)
            )
          )
          .limit(1)

        // Add to group if not already a member
        if (!existingMembership) {
          await db
            .insert(groupMembersTable)
            .values({
              groupId: group.id,
              userId: session.user.id,
              role: 'member',
            })
        }
      }
    }

    return NextResponse.json({ 
      message: "Successfully joined event",
      currentParticipants: event.currentParticipants + 1
    })
  } catch (error) {
    console.error("Event join error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      eventId: params?.eventId
    })
    return NextResponse.json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
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

    // If event has a community, remove user from the group (but keep creator as admin)
    if (event.isInvite === 1 && event.groupName && event.createdBy !== session.user.id) {
      // Find the group associated with this event
      const [group] = await db
        .select()
        .from(groupsTable)
        .where(
          and(
            eq(groupsTable.createdBy, event.createdBy),
            eq(groupsTable.name, event.groupName)
          )
        )
        .limit(1)

      if (group) {
        // Remove from group (only if not the creator)
        await db
          .delete(groupMembersTable)
          .where(
            and(
              eq(groupMembersTable.groupId, group.id),
              eq(groupMembersTable.userId, session.user.id)
            )
          )
      }
    }

    return NextResponse.json({ 
      message: "Successfully left event",
      currentParticipants: Math.max(0, event.currentParticipants - 1)
    })
  } catch (error) {
    console.error("Event leave error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
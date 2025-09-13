import { NextResponse } from 'next/server'
import { db } from '@/src/db/connection'
import { events, users, eventThemes } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      )
    }

    // Find the event by share token and include creator info and theme
    const eventWithDetails = await db
      .select({
        event: events,
        creator: {
          id: users.id,
          username: users.username,
          nickname: users.nickname,
        },
        theme: eventThemes
      })
      .from(events)
      .leftJoin(users, eq(events.createdBy, users.id))
      .leftJoin(eventThemes, eq(events.themeId, eventThemes.id))
      .where(eq(events.shareToken, shareToken))
      .limit(1)

    if (eventWithDetails.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const { event, creator, theme } = eventWithDetails[0]

    // Format the public event data (no sensitive info)
    const publicEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      date: event.date,
      time: event.time,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      createdByUsername: creator?.username || creator?.nickname || "Unknown User",
      isInvite: event.isInvite === 1,
      inviteDescription: event.inviteDescription,
      groupName: event.groupName,
      customFlyerUrl: event.customFlyerUrl,
      theme: theme ? {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        textColor: theme.textColor,
        backgroundGradient: theme.backgroundGradient,
        fontFamily: theme.fontFamily,
        fontWeight: theme.fontWeight,
        borderRadius: theme.borderRadius,
        shadowIntensity: theme.shadowIntensity
      } : null
    }

    return NextResponse.json({
      success: true,
      event: publicEvent
    })

  } catch (error) {
    console.error('Error fetching public event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
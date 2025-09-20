import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/src/db"
import { eventsTable, usersTable, eventThemesTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// GET - Fetch public event by share token
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 })
    }

    // Fetch event with creator info and theme
    const [eventWithDetails] = await db
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
        isInvite: eventsTable.isInvite,
        inviteDescription: eventsTable.inviteDescription,
        groupName: eventsTable.groupName,
        themeId: eventsTable.themeId,
        customFlyerUrl: eventsTable.customFlyerUrl,
        flyerData: eventsTable.flyerData,
        thumbnailVideoUrl: eventsTable.thumbnailVideoUrl,
        thumbnailImageUrl: eventsTable.thumbnailImageUrl,
        customBackgroundUrl: eventsTable.customBackgroundUrl,
        customBackgroundType: eventsTable.customBackgroundType,
        inviteVideoUrl: eventsTable.inviteVideoUrl,
        inviteVideoThumbnail: eventsTable.inviteVideoThumbnail,
        inviteVideoDescription: eventsTable.inviteVideoDescription,
        isRepeating: eventsTable.isRepeating,
        repeatPattern: eventsTable.repeatPattern,
        repeatInterval: eventsTable.repeatInterval,
        repeatEndDate: eventsTable.repeatEndDate,
        repeatDaysOfWeek: eventsTable.repeatDaysOfWeek,
        parentEventId: eventsTable.parentEventId,
        createdAt: eventsTable.createdAt,
        updatedAt: eventsTable.updatedAt,
        creator: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
        theme: {
          id: eventThemesTable.id,
          name: eventThemesTable.name,
          displayName: eventThemesTable.displayName,
          description: eventThemesTable.description,
          primaryColor: eventThemesTable.primaryColor,
          secondaryColor: eventThemesTable.secondaryColor,
          accentColor: eventThemesTable.accentColor,
          textColor: eventThemesTable.textColor,
          backgroundGradient: eventThemesTable.backgroundGradient,
          fontFamily: eventThemesTable.fontFamily,
          fontWeight: eventThemesTable.fontWeight,
          borderRadius: eventThemesTable.borderRadius,
          shadowIntensity: eventThemesTable.shadowIntensity,
          category: eventThemesTable.category,
        },
      })
      .from(eventsTable)
      .leftJoin(usersTable, eq(eventsTable.createdBy, usersTable.id))
      .leftJoin(eventThemesTable, eq(eventsTable.themeId, eventThemesTable.id))
      .where(
        and(
          eq(eventsTable.shareToken, shareToken),
          eq(eventsTable.isActive, 1) // Only active events
        )
      )
      .limit(1)

    if (!eventWithDetails) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const publicEvent = {
      id: eventWithDetails.id.toString(),
      title: eventWithDetails.title,
      description: eventWithDetails.description,
      location: eventWithDetails.location,
      date: eventWithDetails.eventDate,
      time: eventWithDetails.eventTime,
      maxParticipants: eventWithDetails.maxParticipants,
      currentParticipants: eventWithDetails.currentParticipants,
      createdBy: eventWithDetails.createdBy,
      createdByUsername: eventWithDetails.creator?.username || "Unknown User",
      shareUrl: `${process.env.NEXTAUTH_URL}/events/invite/${eventWithDetails.shareToken}`,
      isInvite: eventWithDetails.isInvite === 1,
      inviteDescription: eventWithDetails.inviteDescription,
      groupName: eventWithDetails.groupName,
      themeId: eventWithDetails.themeId,
      customFlyerUrl: eventWithDetails.customFlyerUrl,
      flyerData: eventWithDetails.flyerData,
      thumbnailVideoUrl: eventWithDetails.thumbnailVideoUrl,
      thumbnailImageUrl: eventWithDetails.thumbnailImageUrl,
      customBackgroundUrl: eventWithDetails.customBackgroundUrl,
      customBackgroundType: eventWithDetails.customBackgroundType,
      inviteVideoUrl: eventWithDetails.inviteVideoUrl,
      inviteVideoThumbnail: eventWithDetails.inviteVideoThumbnail,
      inviteVideoDescription: eventWithDetails.inviteVideoDescription,
      isRepeating: eventWithDetails.isRepeating === 1,
      repeatPattern: eventWithDetails.repeatPattern,
      repeatInterval: eventWithDetails.repeatInterval,
      repeatEndDate: eventWithDetails.repeatEndDate,
      repeatDaysOfWeek: eventWithDetails.repeatDaysOfWeek,
      parentEventId: eventWithDetails.parentEventId,
      theme: eventWithDetails.theme && eventWithDetails.theme.id ? eventWithDetails.theme : null,
      createdAt: eventWithDetails.createdAt,
      updatedAt: eventWithDetails.updatedAt,
    }

    return NextResponse.json({ event: publicEvent })
  } catch (error) {
    console.error("Public event GET error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventsTable, usersTable, eventParticipantsTable, groupsTable, groupMembersTable, eventThemesTable, eventMediaTable } from "@/src/db/schema"
import { desc, eq, count, and, gte } from "drizzle-orm"
import { randomBytes } from "crypto"

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch events with creator info, participant counts, and themes
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
      .where(eq(eventsTable.isActive, 1))
      .orderBy(desc(eventsTable.createdAt))

    // Check if current user has joined each event and get video counts
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

        const hasJoined = userParticipation !== undefined

        // Get media count for participants
        let mediaCount = 0
        let hasMedia = false
        if (hasJoined) {
          const [mediaCountResult] = await db
            .select({ count: count() })
            .from(eventMediaTable)
            .where(eq(eventMediaTable.eventId, event.id))

          mediaCount = mediaCountResult?.count || 0
          hasMedia = mediaCount > 0
        }

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
          hasJoined,
          isInvite: event.isInvite === 1,
          inviteDescription: event.inviteDescription,
          groupName: event.groupName,
          themeId: event.themeId,
          customFlyerUrl: event.customFlyerUrl,
          flyerData: event.flyerData,
          thumbnailVideoUrl: event.thumbnailVideoUrl,
          thumbnailImageUrl: event.thumbnailImageUrl,
          customBackgroundUrl: event.customBackgroundUrl,
          customBackgroundType: event.customBackgroundType,
          inviteVideoUrl: event.inviteVideoUrl,
          inviteVideoThumbnail: event.inviteVideoThumbnail,
          inviteVideoDescription: event.inviteVideoDescription,
          isRepeating: event.isRepeating === 1,
          repeatPattern: event.repeatPattern,
          repeatInterval: event.repeatInterval,
          repeatEndDate: event.repeatEndDate,
          repeatDaysOfWeek: event.repeatDaysOfWeek,
          parentEventId: event.parentEventId,
          theme: event.theme && event.theme.id ? event.theme : null,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          mediaCount,
          hasMedia,
        }
      })
    )

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Events GET error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  let body: any = null
  try {
    console.log('🚀 Events POST: Starting request processing')

    const session = await getServerSession(authOptions)
    console.log('🔐 Session check:', { hasSession: !!session, userId: session?.user?.id })

    if (!session?.user?.id) {
      console.log('❌ Unauthorized: No session or user ID')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('📥 Parsing request body...')
    
    // Check if this is FormData (for media uploads) or JSON
    const contentType = request.headers.get('content-type')
    let formData: FormData | null = null
    let mediaFile: File | null = null
    let mediaUrl: string | null = null
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('📁 Processing FormData request with media')
      formData = await request.formData()
      
      // Extract form fields
      body = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        maxAttendees: formData.get('maxAttendees') as string,
        isPublic: formData.get('isPublic') === 'true',
        isRepeating: formData.get('isRepeating') === 'true',
        repeatPattern: formData.get('repeatPattern') as string,
        repeatInterval: formData.get('repeatInterval') ? parseInt(formData.get('repeatInterval') as string) : null,
        repeatEndDate: formData.get('repeatEndDate') as string,
        repeatDaysOfWeek: formData.get('repeatDaysOfWeek') as string,
        enableCommunity: formData.get('enableCommunity') === 'true',
        communityName: formData.get('communityName') as string,
        invitationMessage: formData.get('invitationMessage') as string,
        isDraft: formData.get('isDraft') === 'true'
      }
      
      // Handle media file
      mediaFile = formData.get('media') as File | null
      
      if (mediaFile && mediaFile.size > 0) {
        console.log('📁 Media file found:', {
          name: mediaFile.name,
          size: mediaFile.size,
          type: mediaFile.type
        })
        
        // Import upload function
        const { uploadToR2 } = await import("@/src/lib/r2-storage")
        
        // Convert to buffer and upload
        const bytes = await mediaFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        mediaUrl = await uploadToR2({
          buffer,
          filename: mediaFile.name,
          mimetype: mediaFile.type,
          folder: "event-media",
        })
        
        console.log('✅ Media uploaded:', mediaUrl)
      }
    } else {
      console.log('📋 Processing JSON request')
      body = await request.json()
    }
    
    console.log('📋 Parsed body:', body)
    
    const { 
      title, description, location, date, time, maxAttendees, 
      isPublic, isRepeating, repeatPattern, repeatInterval, repeatEndDate, repeatDaysOfWeek,
      enableCommunity, communityName, invitationMessage, isDraft
    } = body

    // Auto-generate title if not provided (for new simplified flow)
    const eventTitle = title?.trim() || `Event - ${new Date().toLocaleDateString()}`

    // Validation - less strict for drafts and new simplified flow
    console.log('✅ Validating required fields...')
    if (!isDraft) {
      if (!description?.trim() || !location?.trim() || !date || !time) {
        console.log('❌ Validation failed: Missing required fields')
        return NextResponse.json({ 
          error: "Description, location, date, and time are required" 
        }, { status: 400 })
      }

      // Validate community fields if enabled
      if (enableCommunity && communityName?.trim()) {
        // Community name is sufficient, invitation message is optional
      }
    }

    // Validate date is not in the past (only for published events)
    if (!isDraft && date) {
      const eventDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (eventDate < today) {
        return NextResponse.json({ 
          error: "Event date cannot be in the past" 
        }, { status: 400 })
      }
    }

    // Generate unique share token
    console.log('🔑 Generating share token...')
    const shareToken = randomBytes(32).toString('hex')
    console.log('✅ Share token generated')

    // Create the event
    console.log('💾 Inserting event into database...')
    const [newEvent] = await db
      .insert(eventsTable)
      .values({
        title: eventTitle,
        description: description?.trim() || null,
        location: location?.trim() || null,
        eventDate: date || null,
        eventTime: time || null,
        maxParticipants: maxAttendees ? parseInt(maxAttendees) : null,
        currentParticipants: isDraft ? 0 : 1, // Creator is first participant only for published events
        createdBy: session.user.id,
        shareToken,
        isActive: isDraft ? 0 : 1, // Drafts are inactive
        isInvite: enableCommunity ? 1 : 0,
        inviteDescription: enableCommunity ? (invitationMessage?.trim() || description?.trim()) : null,
        groupName: enableCommunity ? (communityName?.trim() || null) : null,
        themeId: null, // No themes in simplified flow
        customBackgroundUrl: mediaUrl || null, // Use uploaded media as background
        customBackgroundType: mediaFile?.type.startsWith('video/') ? 'video' : 'image',
        inviteVideoUrl: null,
        inviteVideoThumbnail: null,
        inviteVideoDescription: null,
        isRepeating: isRepeating ? 1 : 0,
        repeatPattern: isRepeating ? repeatPattern : null,
        repeatInterval: isRepeating ? repeatInterval || 1 : null,
        repeatEndDate: isRepeating ? repeatEndDate : null,
        repeatDaysOfWeek: isRepeating ? repeatDaysOfWeek : null,
      })
      .returning()

    // Add creator as first participant (only for published events)
    if (!isDraft) {
      await db
        .insert(eventParticipantsTable)
        .values({
          eventId: newEvent.id,
          userId: session.user.id,
        })
    }

    // Create community group if enabled
    let groupId = null
    if (enableCommunity && communityName?.trim() && !isDraft) {
      const [newGroup] = await db
        .insert(groupsTable)
        .values({
          name: communityName.trim(),
          description: `Community for ${eventTitle}`,
          createdBy: session.user.id,
          isActive: 1,
          maxMembers: maxAttendees ? parseInt(maxAttendees) : null, // Use same limit as event
        })
        .returning()

      groupId = newGroup.id

      // Add creator as group admin
      await db
        .insert(groupMembersTable)
        .values({
          groupId: newGroup.id,
          userId: session.user.id,
          role: 'admin',
        })
    }

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

    // Fetch theme data if theme was selected
    let eventTheme = null
    if (newEvent.themeId) {
      const [theme] = await db
        .select()
        .from(eventThemesTable)
        .where(eq(eventThemesTable.id, newEvent.themeId))
        .limit(1)
      eventTheme = theme || null
    }

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
      hasJoined: !isDraft, // Creator has joined by default only for published events
      isInvite: newEvent.isInvite === 1,
      inviteDescription: newEvent.inviteDescription,
      groupName: newEvent.groupName,
      themeId: newEvent.themeId,
      customFlyerUrl: newEvent.customFlyerUrl,
      flyerData: newEvent.flyerData,
      thumbnailVideoUrl: newEvent.thumbnailVideoUrl,
      thumbnailImageUrl: newEvent.thumbnailImageUrl,
      customBackgroundUrl: newEvent.customBackgroundUrl,
      customBackgroundType: newEvent.customBackgroundType,
      inviteVideoUrl: newEvent.inviteVideoUrl,
      inviteVideoThumbnail: newEvent.inviteVideoThumbnail,
      inviteVideoDescription: newEvent.inviteVideoDescription,
      isRepeating: newEvent.isRepeating === 1,
      repeatPattern: newEvent.repeatPattern,
      repeatInterval: newEvent.repeatInterval,
      repeatEndDate: newEvent.repeatEndDate,
      repeatDaysOfWeek: newEvent.repeatDaysOfWeek,
      parentEventId: newEvent.parentEventId,
      theme: eventTheme,
      groupId: groupId,
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
      isDraft: isDraft,
    }

    console.log('✅ Event created successfully:', { 
      id: responseEvent.id, 
      title: responseEvent.title, 
      themeId: responseEvent.themeId,
      hasTheme: !!eventTheme,
      isDraft: isDraft
    })

    return NextResponse.json({ event: responseEvent })
  } catch (error) {
    console.error("Events POST error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    })
    
    // Log the request body for debugging
    console.error("Request body that caused error:", body)
    
    return NextResponse.json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}
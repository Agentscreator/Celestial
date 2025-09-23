"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, MapPin, Users, Clock, ArrowLeft, Video, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { TypingAnimation } from "@/components/typing-animation"
import { ThemedEventCard } from "@/components/events/ThemedEventCard"
import { EventVideoUpload } from "@/components/events/EventVideoUpload"
import { EventVideos } from "@/components/events/EventVideos"

interface Event {
  id: string
  title: string
  description: string
  location: string
  date: string
  time: string
  maxParticipants?: number
  currentParticipants: number
  createdBy: string
  createdByUsername: string
  shareUrl: string
  hasJoined: boolean
  isInvite?: boolean
  inviteDescription?: string
  groupName?: string
  themeId?: number | null
  customFlyerUrl?: string
  flyerData?: string
  customBackgroundUrl?: string
  customBackgroundType?: 'image' | 'video' | 'gif'
  theme?: any | null
  createdAt: string
  updatedAt: string
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoRefreshTrigger, setVideoRefreshTrigger] = useState(0)

  // Load event details
  const loadEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Convert eventId to string for comparison since API returns string IDs
        const foundEvent = data.events?.find((e: Event) => e.id.toString() === eventId.toString())

        if (foundEvent) {
          setEvent(foundEvent)
        } else {
          console.error('Event not found:', { eventId, availableEvents: data.events?.map((e: Event) => ({ id: e.id, title: e.title })) })
          setError("Event not found")
        }
      } else {
        console.error('Failed to load events:', response.status, response.statusText)
        setError("Failed to load event")
      }
    } catch (error) {
      console.error('Error loading event:', error)
      setError("Failed to load event")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  const handleJoinEvent = async () => {
    if (!event) return

    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(prev => prev ? {
          ...prev,
          currentParticipants: data.currentParticipants,
          hasJoined: true
        } : null)

        toast({
          title: "Joined!",
          description: "You've successfully joined this event.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to join event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error joining event:', error)
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      })
    }
  }

  const handleLeaveEvent = async () => {
    if (!event) return

    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(prev => prev ? {
          ...prev,
          currentParticipants: data.currentParticipants,
          hasJoined: false
        } : null)

        toast({
          title: "Left event",
          description: "You've left this event.",
        })

        // Redirect to events page since user is no longer a participant
        router.push('/events')
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to leave event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error leaving event:', error)
      toast({
        title: "Error",
        description: "Failed to leave event",
        variant: "destructive",
      })
    }
  }

  const handleShareEvent = async () => {
    if (!event?.shareUrl) return

    // Try native sharing first
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: event.shareUrl,
        })
        return
      } catch (shareError) {
        console.log('Native sharing failed, falling back to clipboard')
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(event.shareUrl)
      toast({
        title: "Link copied!",
        description: "The event link has been copied to your clipboard.",
      })
    } catch (clipboardError) {
      toast({
        title: "Share Event",
        description: `Copy this link: ${event.shareUrl}`,
      })
    }
  }

  const handleVideoUploaded = (video: any) => {
    // Trigger refresh of videos component
    setVideoRefreshTrigger(prev => prev + 1)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <TypingAnimation />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">{error || "Event not found"}</div>
        <Link href="/events">
          <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  if (!event.hasJoined) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        <ThemedEventCard
          event={event}
          theme={event.theme}
          onJoin={handleJoinEvent}
          onLeave={handleLeaveEvent}
          onShare={handleShareEvent}
          showFullDetails={true}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/events">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-white">{event.title}</h1>
          <p className="text-gray-400 mt-1">Event Details & Media</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleShareEvent}
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <EventVideoUpload
            eventId={eventId}
            onVideoUploaded={handleVideoUploaded}
          />
        </div>
      </div>

      {/* Event Media */}
      {event.customBackgroundUrl && (
        <div className="w-full">
          <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {event.customBackgroundType === 'video' ? (
                <video
                  src={event.customBackgroundUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  poster={event.customBackgroundUrl.replace(/\.[^/.]+$/, '_thumbnail.jpg')}
                >
                  <source src={event.customBackgroundUrl} type="video/mp4" />
                  <source src={event.customBackgroundUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={event.customBackgroundUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="flex items-center gap-2 text-white">
                  {event.customBackgroundType === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {event.customBackgroundType === 'video' ? 'Event Video' : 'Event Image'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Event Info */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <div className="text-white font-medium">{formatDate(event.date)}</div>
                  <div className="text-gray-400 text-sm">{formatTime(event.time)}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="text-gray-300">{event.location}</div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <div className="text-white">
                    {event.currentParticipants}
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                    {" participants"}
                  </div>
                  {event.maxParticipants && (
                    <div className="text-gray-400 text-sm">
                      {event.maxParticipants - event.currentParticipants} spots remaining
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Description</div>
                <p className="text-gray-300">{event.description}</p>
              </div>

              {event.isInvite && event.groupName && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400 mb-2">Community</div>
                  <div className="text-green-400">{event.groupName}</div>
                  {event.inviteDescription && (
                    <p className="text-gray-400 text-sm mt-1">{event.inviteDescription}</p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  Organized by {event.createdByUsername}
                </Badge>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={handleLeaveEvent}
                  className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  Leave Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videos Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger
                value="videos"
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gray-700"
              >
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              {/* Future tabs could include Photos, Discussion, etc. */}
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              <EventVideos
                eventId={eventId}
                refreshTrigger={videoRefreshTrigger}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
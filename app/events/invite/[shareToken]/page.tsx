"use client"

import React, { useState, useEffect } from "react"
import { Calendar, MapPin, Users, Clock, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface PublicEvent {
  id: string
  title: string
  description: string
  location: string
  date: string
  time: string
  maxParticipants?: number
  currentParticipants: number
  createdByUsername: string
  isInvite?: boolean
  inviteDescription?: string
  groupName?: string
  customFlyerUrl?: string
  inviteVideoUrl?: string
  inviteVideoThumbnail?: string
  inviteVideoDescription?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    textColor?: string
    backgroundGradient?: string
    fontFamily?: string
    fontWeight?: string
    borderRadius?: number
    shadowIntensity?: string
  } | null
}

export default function PublicEventInvitePage() {
  const params = useParams()
  const router = useRouter()
  const shareToken = params.shareToken as string
  const { data: session, status } = useSession()

  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

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

  const getShadowClass = (intensity?: string) => {
    switch (intensity) {
      case 'low': return 'shadow-sm'
      case 'medium': return 'shadow-md'
      case 'high': return 'shadow-lg'
      default: return 'shadow-md'
    }
  }

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/events/public/${shareToken}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Event not found or invite link is invalid')
          } else {
            setError('Failed to load event')
          }
          return
        }
        
        const data = await response.json()
        setEvent(data.event)
      } catch (err) {
        console.error('Error fetching event:', err)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (shareToken) {
      fetchEvent()
    }
  }, [shareToken])

  const handleJoinClick = async () => {
    if (!session) {
      // Redirect to signup with return URL
      const signupUrl = `/auth/signup?returnTo=${encodeURIComponent(window.location.pathname)}`
      router.push(signupUrl)
      return
    }

    if (!event) return

    try {
      setJoining(true)
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(prev => prev ? {
          ...prev,
          currentParticipants: data.currentParticipants
        } : null)

        toast({
          title: "Joined!",
          description: "You've successfully joined this event.",
        })

        // Redirect to the authenticated event page
        router.push(`/events/${event.id}`)
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
    } finally {
      setJoining(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: event?.title || 'Check out this event',
          text: event?.description || 'Join this amazing event!',
          url: shareUrl,
        })
        return
      } catch (shareError) {
        // Fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied!",
        description: "Event link has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Share",
        description: `Copy this link: ${shareUrl}`,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-400 text-6xl">⚠️</div>
              <h2 className="text-xl font-semibold text-white">Event Not Found</h2>
              <p className="text-gray-400">
                {error || "This event invite link is invalid or the event may have been removed."}
              </p>
              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default theme fallback
  const cardTheme = event.theme || {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    fontFamily: 'Inter',
    fontWeight: '400',
    borderRadius: 8,
    shadowIntensity: 'medium'
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-gray-400">Join this amazing event</p>
        </div>

        {/* Event Card */}
        <Card 
          className={`overflow-hidden transition-all ${getShadowClass(cardTheme.shadowIntensity)} border-0 mb-6`}
          style={{
            borderRadius: `${cardTheme.borderRadius}px`,
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(10px)',
            fontFamily: cardTheme.fontFamily
          }}
        >
          {/* Themed Header */}
          <div 
            className="h-32 relative overflow-hidden"
            style={{ background: cardTheme.backgroundGradient }}
          >
            {/* Custom flyer background if available */}
            {event.customFlyerUrl && (
              <div 
                className="absolute inset-0 opacity-30 bg-cover bg-center"
                style={{ backgroundImage: `url(${event.customFlyerUrl})` }}
              />
            )}
            
            {/* Overlay content */}
            <div className="absolute inset-0 flex items-end p-6">
              <div className="w-full">
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: cardTheme.textColor,
                    fontWeight: cardTheme.fontWeight
                  }}
                >
                  {event.title}
                </h2>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>hosted by</span>
                  <span 
                    className="font-semibold"
                    style={{ color: cardTheme.accentColor }}
                  >
                    @{event.createdByUsername}
                  </span>
                  {event.isInvite && (
                    <Badge 
                      className="text-xs px-2 py-1 ml-2"
                      style={{ 
                        backgroundColor: `${cardTheme.accentColor}20`,
                        color: cardTheme.textColor,
                        border: `1px solid ${cardTheme.accentColor}40`
                      }}
                    >
                      Community Event
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div 
              className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: cardTheme.accentColor }}
            />
            <div 
              className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-20"
              style={{ backgroundColor: cardTheme.secondaryColor }}
            />
          </div>

          <CardContent className="p-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">{event.description}</p>
            
            {/* Event Video */}
            {event.inviteVideoUrl && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-gray-800">
                  <video
                    src={event.inviteVideoUrl}
                    poster={event.inviteVideoThumbnail}
                    controls
                    className="w-full h-auto max-h-96 object-cover"
                    playsInline
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                {event.inviteVideoDescription && (
                  <p className="text-sm text-gray-400 italic">
                    {event.inviteVideoDescription}
                  </p>
                )}
              </div>
            )}
            
            {event.isInvite && event.inviteDescription && (
              <div 
                className="rounded-lg p-4 border"
                style={{ 
                  backgroundColor: `${cardTheme.primaryColor}10`,
                  borderColor: `${cardTheme.primaryColor}30`
                }}
              >
                <p 
                  className="font-semibold mb-2"
                  style={{ color: cardTheme.accentColor }}
                >
                  What you're invited to do:
                </p>
                <p className="text-gray-300 mb-3">
                  {event.inviteDescription}
                </p>
                {event.groupName && (
                  <p 
                    className="text-sm opacity-80"
                    style={{ color: cardTheme.accentColor }}
                  >
                    Join "{event.groupName}" community chat
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="h-5 w-5" style={{ color: cardTheme.accentColor }} />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="h-5 w-5" style={{ color: cardTheme.accentColor }} />
                  <span>{formatDate(event.date)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock className="h-5 w-5" style={{ color: cardTheme.accentColor }} />
                  <span>{formatTime(event.time)}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-400">
                  <Users className="h-5 w-5" style={{ color: cardTheme.accentColor }} />
                  <span>
                    Join others at this event
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 gap-3 px-6 pb-6">
            <Button
              onClick={handleJoinClick}
              disabled={joining || status === "loading"}
              className="flex-1 text-white font-semibold py-3"
              style={{
                backgroundColor: cardTheme.primaryColor,
                borderRadius: `${cardTheme.borderRadius}px`
              }}
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : session ? (
                "Join Event"
              ) : (
                "Sign Up & Join Event"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-4 py-3"
              style={{ borderRadius: `${cardTheme.borderRadius}px` }}
            >
              Share
            </Button>
          </CardFooter>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <p className="text-gray-400">
            Don't have an account? 
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 ml-1">
              Sign up now
            </Link>
            {" "}to join events and connect with your community.
          </p>
          
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Explore More Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Plus, Search, Clock } from "lucide-react"
import { ThemedEventCard } from "@/components/events/ThemedEventCard"
import { toast } from "@/hooks/use-toast"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  currentParticipants: number
  maxParticipants?: number
  theme?: any
  isPublic: boolean
  createdBy: string
  createdByUsername: string
  shareUrl: string
  hasJoined: boolean
  isInvite?: boolean
  inviteDescription?: string
  groupName?: string
  themeId?: number | null
  customFlyerUrl?: string
  customBackgroundUrl?: string
  customBackgroundType?: 'image' | 'gif'
  thumbnailVideoUrl?: string
  thumbnailImageUrl?: string
  isRepeating?: boolean
  repeatPattern?: string
  mediaCount?: number
  hasMedia?: boolean
  status?: 'upcoming' | 'ongoing' | 'completed'
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")


  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (!event || !event.title) return false
    
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh events to get updated participant count
        fetchEvents()
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

  const handleLeaveEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        // Refresh events to get updated participant count
        fetchEvents()
        toast({
          title: "Left event",
          description: "You've left this event.",
        })
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

  const handleShareEvent = async (event: Event) => {
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

  const handleViewDetails = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      case 'ongoing': return 'bg-green-500/20 text-green-300 border border-green-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
      {/* Dark Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 border-2 border-gray-700 rounded-full mb-6 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white tracking-tight">
            Events
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-light">
            Discover and manage your events
          </p>
          <Button
            onClick={() => router.push('/events/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg border-0 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Search */}
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-lg p-6 mb-8 transition-all duration-300 hover:border-gray-600 hover:shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-all duration-300"
            />
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-600 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 border-2 border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No events found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto font-light">
              {searchTerm
                ? "Try adjusting your search to find more events"
                : "Get started by creating your first event and bringing people together"
              }
            </p>
            <Button
              onClick={() => router.push('/events/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg border-0 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <ThemedEventCard
                key={event.id}
                event={event}
                theme={event.theme}
                onJoin={handleJoinEvent}
                onLeave={handleLeaveEvent}
                onShare={handleShareEvent}
                onViewDetails={handleViewDetails}
                showFullDetails={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Users, Plus, Share2, Clock, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { TypingAnimation } from "@/components/typing-animation"
import { EventsCalendar } from "@/components/events-calendar"
import { ThemeSelector, type EventTheme } from "@/components/events/ThemeSelector"
import { ThemedEventCard } from "@/components/events/ThemedEventCard"
import { FlyerGenerator } from "@/components/events/FlyerGenerator"
import { EventVideoUpload } from "@/components/events/EventVideoUpload"

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
  theme?: EventTheme | null
  createdAt: string
  updatedAt: string
  videoCount?: number
  hasVideos?: boolean
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    maxParticipants: "",
  })
  
  // Community invitation state
  const [enableInvites, setEnableInvites] = useState(true)
  const [inviteDescription, setInviteDescription] = useState('')
  const [communityName, setCommunityName] = useState('')

  // Theme system state
  const [themes, setThemes] = useState<EventTheme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null)
  const [themesLoading, setThemesLoading] = useState(false)
  const [showFlyerPreview, setShowFlyerPreview] = useState(false)

  // Video upload state
  const [enableVideoUpload, setEnableVideoUpload] = useState(false)
  const [eventVideos, setEventVideos] = useState<any[]>([])
  const [tempEventId, setTempEventId] = useState<string | null>(null)

  const generateCommunityName = () => {
    if (formData.title.trim()) {
      // Extract first few words from title
      const words = formData.title.trim().split(' ').slice(0, 3)
      const generatedName = words.join(' ') + ' Community'
      setCommunityName(generatedName)
    } else {
      setCommunityName('My Event Community')
    }
  }

  // Load events from API
  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        console.error('Failed to load events:', response.status)
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load themes from API
  const loadThemes = async () => {
    try {
      setThemesLoading(true)
      const response = await fetch('/api/events/themes', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes || [])
      } else {
        console.error('Failed to load themes:', response.status)
      }
    } catch (error) {
      console.error('Error loading themes:', error)
    } finally {
      setThemesLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
    loadThemes()
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (enableInvites && !inviteDescription.trim()) {
      toast({
        title: "Invite description required",
        description: "Please describe what you're inviting people to do",
        variant: "destructive",
      })
      return
    }

    if (enableInvites && !communityName.trim()) {
      toast({
        title: "Community name required",
        description: "Please provide a name for your community",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: formData.date,
          time: formData.time,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          isInvite: enableInvites,
          inviteDescription: enableInvites ? inviteDescription.trim() : null,
          groupName: enableInvites && communityName.trim() ? communityName.trim() : null,
          themeId: selectedThemeId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEvents([data.event, ...events])

        // If video upload is enabled, set the temp event ID for video uploads
        if (enableVideoUpload) {
          setTempEventId(data.event.id)
          toast({
            title: "Event Created",
            description: enableVideoUpload && eventVideos.length === 0
              ? "Event created! You can now upload videos before finishing."
              : "Event created successfully!",
          })
        } else {
          // Close modal immediately if no video upload needed
          setIsCreateModalOpen(false)
          setFormData({
            title: "",
            description: "",
            location: "",
            date: "",
            time: "",
            maxParticipants: "",
          })
          setEnableInvites(true)
          setInviteDescription('')
          setCommunityName('')
          setSelectedThemeId(null)
          setEnableVideoUpload(false)
          setEventVideos([])
          setTempEventId(null)

          toast({
            title: "Success",
            description: enableInvites
              ? "Your event and community have been created!"
              : "Your event has been created!",
          })
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, currentParticipants: data.currentParticipants, hasJoined: true }
            : event
        ))

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
        const data = await response.json()
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, currentParticipants: data.currentParticipants, hasJoined: false }
            : event
        ))

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
    // Check if shareUrl exists
    if (!event.shareUrl) {
      toast({
        title: "Error",
        description: "Share link is not available for this event.",
        variant: "destructive",
      })
      return
    }

    // Try native sharing on mobile devices first
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: event.shareUrl,
        })
        return
      } catch (shareError) {
        // Fall through to clipboard copy if native sharing fails
        console.log('Native sharing failed, falling back to clipboard')
      }
    }

    // Try clipboard copy
    try {
      await navigator.clipboard.writeText(event.shareUrl)
      toast({
        title: "Link copied!",
        description: "The event link has been copied to your clipboard.",
      })
    } catch (clipboardError) {
      // Final fallback: show the URL in a toast
      console.error('Clipboard access failed:', clipboardError)
      toast({
        title: "Share Event",
        description: `Copy this link: ${event.shareUrl}`,
      })
    }
  }

  const handleViewDetails = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  const handleVideoUploaded = (video: any) => {
    setEventVideos(prev => [...prev, video])
  }

  const handleFinishEventCreation = () => {
    setIsCreateModalOpen(false)
    setFormData({
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      maxParticipants: "",
    })
    setEnableInvites(true)
    setInviteDescription('')
    setCommunityName('')
    setSelectedThemeId(null)
    setEnableVideoUpload(false)
    setEventVideos([])
    setTempEventId(null)

    toast({
      title: "Success",
      description: eventVideos.length > 0
        ? `Event created with ${eventVideos.length} video${eventVideos.length > 1 ? 's' : ''}!`
        : "Event created successfully!",
    })
  }

  const handleCancelEventCreation = () => {
    if (tempEventId) {
      // If we have a temp event ID, the event was already created
      // We could optionally delete it here, but for now we'll just close
      toast({
        title: "Event Saved",
        description: "Your event has been created. You can add videos later from the event details page.",
      })
    }

    setIsCreateModalOpen(false)
    setFormData({
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      maxParticipants: "",
    })
    setEnableInvites(true)
    setInviteDescription('')
    setCommunityName('')
    setSelectedThemeId(null)
    setEnableVideoUpload(false)
    setEventVideos([])
    setTempEventId(null)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white">Events</h1>
          <p className="text-gray-400 mt-1">Create and discover amazing experiences</p>
        </div>
        
        <div className="flex items-center gap-3">
          <EventsCalendar events={events} />
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="What's the event?"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell people what to expect..."
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Where will it happen?"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                  placeholder="Leave empty for unlimited"
                  className="bg-gray-800 border-gray-600 text-white"
                  min="2"
                />
              </div>

              {/* Community Invitation Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Community</Label>
                    <p className="text-sm text-gray-400">Create a community chat for event participants</p>
                  </div>
                  <Switch
                    checked={enableInvites}
                    onCheckedChange={setEnableInvites}
                  />
                </div>

                {enableInvites && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div>
                      <Label className="text-sm font-medium">What are you inviting people to do?</Label>
                      <Textarea
                        placeholder="e.g., Join me for a coffee meetup, Come hiking with me, Let's play basketball..."
                        value={inviteDescription}
                        onChange={(e) => setInviteDescription(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                        maxLength={200}
                        rows={2}
                      />
                      <div className="text-right text-sm text-gray-400 mt-1">
                        {inviteDescription.length}/200
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Community Name</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateCommunityName}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Generate
                        </Button>
                      </div>
                      <Input
                        placeholder="Name your community..."
                        value={communityName}
                        onChange={(e) => setCommunityName(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        People who join will be added to this community chat
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Selection */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Theme Selector */}
                  <div>
                    <div className="max-h-96 overflow-y-auto">
                      {themesLoading ? (
                        <div className="flex justify-center py-8">
                          <TypingAnimation />
                        </div>
                      ) : (
                        <ThemeSelector
                          themes={themes}
                          selectedThemeId={selectedThemeId}
                          onThemeSelect={setSelectedThemeId}
                        />
                      )}
                    </div>
                  </div>

                  {/* Flyer Preview */}
                  {formData.title && formData.location && formData.date && formData.time && (
                    <div>
                      <Label className="text-base font-medium mb-4 block">Event Flyer Preview</Label>
                      <FlyerGenerator
                        event={{
                          title: formData.title,
                          description: formData.description,
                          location: formData.location,
                          date: formData.date,
                          time: formData.time,
                          createdByUsername: "Preview"
                        }}
                        theme={selectedThemeId ? themes.find(t => t.id === selectedThemeId) : null}
                        onPreview={() => setShowFlyerPreview(true)}
                        onDownload={() => toast({
                          title: "Download",
                          description: "Flyer download will be available after event creation!",
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Video Upload Section */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Add Videos</Label>
                    <p className="text-sm text-gray-400">Upload videos to share with event participants</p>
                  </div>
                  <Switch
                    checked={enableVideoUpload}
                    onCheckedChange={setEnableVideoUpload}
                  />
                </div>

                {enableVideoUpload && tempEventId && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-white">Event Videos</h4>
                        <div className="text-xs text-gray-400">
                          {eventVideos.length} video{eventVideos.length !== 1 ? 's' : ''} uploaded
                        </div>
                      </div>

                      <EventVideoUpload
                        eventId={tempEventId}
                        onVideoUploaded={handleVideoUploaded}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-gray-600 text-white hover:bg-gray-800"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Add Video
                        </Button>
                      </EventVideoUpload>

                      {eventVideos.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {eventVideos.map((video, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                              <Video className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-white flex-1">
                                {video.title || `Video ${index + 1}`}
                              </span>
                              <span className="text-xs text-gray-400">
                                {video.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {enableVideoUpload && !tempEventId && (
                  <div className="text-sm text-gray-400 text-center py-4">
                    Create the event first to upload videos
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEventCreation}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>

                {/* Show different buttons based on state */}
                {tempEventId ? (
                  <Button
                    type="button"
                    onClick={handleFinishEventCreation}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Finish Event Creation
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {enableVideoUpload ? 'Create Event & Add Videos' : 'Create Event'}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <ThemedEventCard
            key={event.id}
            event={event}
            theme={event.theme}
            onJoin={handleJoinEvent}
            onLeave={handleLeaveEvent}
            onShare={handleShareEvent}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-2">No events yet</div>
          <p className="text-sm text-gray-500">Create your first event to get started!</p>
        </div>
      )}
    </div>
  )
}
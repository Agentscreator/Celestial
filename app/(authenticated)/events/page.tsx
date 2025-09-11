"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, MapPin, Users, Plus, Share2, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { TypingAnimation } from "@/components/typing-animation"

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
  createdAt: string
  updatedAt: string
}

export default function EventsPage() {
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

  useEffect(() => {
    loadEvents()
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEvents([data.event, ...events])
        setIsCreateModalOpen(false)
        setFormData({
          title: "",
          description: "",
          location: "",
          date: "",
          time: "",
          maxParticipants: "",
        })

        toast({
          title: "Success",
          description: "Your event has been created!",
        })
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
    try {
      await navigator.clipboard.writeText(event.shareUrl)
      toast({
        title: "Link copied!",
        description: "The event link has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Share",
        description: `Share this event: ${event.title}`,
      })
    }
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
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Invite</DialogTitle>
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
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Invite
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 text-white hover:bg-gray-900/70 transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-white">{event.title}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>by</span>
                <span className="font-medium text-blue-400">@{event.createdByUsername}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(event.time)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>
                    {event.currentParticipants}
                    {event.maxParticipants && ` / ${event.maxParticipants}`} 
                    {" "}participants
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 gap-2">
              <Button
                onClick={() => event.hasJoined ? handleLeaveEvent(event.id) : handleJoinEvent(event.id)}
                className={`flex-1 text-white ${
                  event.hasJoined 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={!event.hasJoined && event.maxParticipants ? event.currentParticipants >= event.maxParticipants : false}
              >
                {!event.hasJoined && event.maxParticipants && event.currentParticipants >= event.maxParticipants 
                  ? "Full" 
                  : event.hasJoined 
                    ? "Leave" 
                    : "Join"
                }
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShareEvent(event)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
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
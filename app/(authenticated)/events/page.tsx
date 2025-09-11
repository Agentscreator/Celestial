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

interface Invite {
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
}

export default function EventsPage() {
  const [invites, setInvites] = useState<Invite[]>([])
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

  // Mock data for development
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setInvites([
        {
          id: "1",
          title: "Beach Volleyball",
          description: "Let's play some beach volleyball this weekend! All skill levels welcome.",
          location: "Santa Monica Beach",
          date: "2024-03-15",
          time: "10:00",
          maxParticipants: 8,
          currentParticipants: 3,
          createdBy: "user1",
          createdByUsername: "sarah_beach",
          shareUrl: "https://app.com/events/invite/1"
        },
        {
          id: "2",
          title: "Coffee & Code",
          description: "Working session at a cozy cafe. Bring your laptop and let's get productive together!",
          location: "Blue Bottle Coffee, Downtown",
          date: "2024-03-12",
          time: "14:00",
          currentParticipants: 2,
          createdBy: "user2",
          createdByUsername: "dev_mike",
          shareUrl: "https://app.com/events/invite/2"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Create new invite
    const newInvite: Invite = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: formData.date,
      time: formData.time,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      currentParticipants: 1,
      createdBy: "current_user",
      createdByUsername: "you",
      shareUrl: `https://app.com/events/invite/${Date.now()}`
    }

    setInvites([newInvite, ...invites])
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
      description: "Your invite has been created!",
    })
  }

  const handleJoinInvite = async (inviteId: string) => {
    setInvites(invites.map(invite => 
      invite.id === inviteId 
        ? { ...invite, currentParticipants: invite.currentParticipants + 1 }
        : invite
    ))

    toast({
      title: "Joined!",
      description: "You've successfully joined this event.",
    })
  }

  const handleShareInvite = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.shareUrl)
      toast({
        title: "Link copied!",
        description: "The invite link has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Share",
        description: `Share this event: ${invite.title}`,
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
            <form onSubmit={handleCreateInvite} className="space-y-4">
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
        {invites.map((invite) => (
          <Card key={invite.id} className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 text-white hover:bg-gray-900/70 transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-white">{invite.title}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>by</span>
                <span className="font-medium text-blue-400">@{invite.createdByUsername}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-gray-300 text-sm leading-relaxed">{invite.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{invite.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(invite.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(invite.time)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>
                    {invite.currentParticipants}
                    {invite.maxParticipants && ` / ${invite.maxParticipants}`} 
                    {" "}participants
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 gap-2">
              <Button
                onClick={() => handleJoinInvite(invite.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={invite.maxParticipants ? invite.currentParticipants >= invite.maxParticipants : false}
              >
                {invite.maxParticipants && invite.currentParticipants >= invite.maxParticipants ? "Full" : "Join"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShareInvite(invite)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {invites.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-2">No events yet</div>
          <p className="text-sm text-gray-500">Create your first invite to get started!</p>
        </div>
      )}
    </div>
  )
}
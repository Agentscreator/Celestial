"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Plus, Search, Clock } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  attendees: number
  maxAttendees?: number
  theme: string
  isPublic: boolean
  createdBy: string
  status: 'upcoming' | 'ongoing' | 'completed'
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
              <div
                key={event.id}
                className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:border-gray-600 group"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {event.title || 'Untitled Event'}
                  </h3>
                  <Badge className={`${getStatusColor(event.status || 'upcoming')} text-xs font-medium px-3 py-1 rounded-full`}>
                    {event.status || 'upcoming'}
                  </Badge>
                </div>

                <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                  {event.description || 'No description available'}
                </p>

                <div className="space-y-3">
                  {event.date && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="w-4 h-4 mr-3 text-blue-400" />
                      {formatDate(event.date)}
                    </div>
                  )}
                  {event.time && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="w-4 h-4 mr-3 text-blue-400" />
                      {formatTime(event.time)}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center text-sm text-gray-300">
                      <MapPin className="w-4 h-4 mr-3 text-blue-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="flex items-center text-sm text-gray-300">
                      <Users className="w-4 h-4 mr-3 text-blue-400" />
                      {event.attendees || 0} {event.maxAttendees && `/ ${event.maxAttendees}`}
                    </div>
                    <Badge
                      className={`text-xs font-medium px-3 py-1 rounded-full ${event.isPublic !== false
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}
                    >
                      {event.isPublic !== false ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
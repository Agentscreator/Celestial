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
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'ongoing': return 'bg-gray-800 text-white border border-gray-600'
      case 'completed': return 'bg-gray-300 text-gray-600 border border-gray-400'
      default: return 'bg-gray-200 text-gray-700 border border-gray-300'
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-serif antialiased">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-2 border-gray-300 rounded-full mb-6 shadow-sm">
            <Calendar className="w-8 h-8 text-gray-700" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
            Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-light">
            Discover and manage your events
          </p>
          <Button
            onClick={() => router.push('/events/new')}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-none border-0 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-none p-6 mb-8 transition-all duration-300 hover:shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-none transition-all duration-300"
            />
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-none p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded-none w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded-none w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded-none"></div>
                    <div className="h-3 bg-gray-200 rounded-none w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Calendar className="w-12 h-12 text-gray-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No events found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto font-light">
              {searchTerm
                ? "Try adjusting your search to find more events"
                : "Get started by creating your first event and bringing people together"
              }
            </p>
            <Button
              onClick={() => router.push('/events/new')}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-none border-0 transition-all duration-200 shadow-sm hover:shadow-md"
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
                className="bg-white border border-gray-200 rounded-none p-6 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-gray-300 group"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {event.title}
                  </h3>
                  <Badge className={`${getStatusColor(event.status)} text-xs font-medium px-3 py-1 rounded-none`}>
                    {event.status}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-6 font-light">
                  {event.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Clock className="w-4 h-4 mr-3 text-gray-500" />
                    {formatTime(event.time)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="w-4 h-4 mr-3 text-gray-500" />
                      {event.attendees} {event.maxAttendees && `/ ${event.maxAttendees}`}
                    </div>
                    <Badge
                      className={`text-xs font-medium px-3 py-1 rounded-none ${event.isPublic
                          ? 'bg-gray-100 text-gray-800 border border-gray-300'
                          : 'bg-gray-800 text-white border border-gray-600'
                        }`}
                    >
                      {event.isPublic ? "Public" : "Private"}
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
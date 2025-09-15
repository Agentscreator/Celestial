"use client"

import React from "react"
import { Calendar, MapPin, Users, Share2, Clock, Video } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { EventTheme } from "./ThemeSelector"

interface ThemedEventCardProps {
  event: {
    id: string
    title: string
    description: string
    location: string
    date: string
    time: string
    maxParticipants?: number
    currentParticipants: number
    createdByUsername: string
    shareUrl: string
    hasJoined: boolean
    isInvite?: boolean
    inviteDescription?: string
    groupName?: string
    customFlyerUrl?: string
    videoCount?: number
    hasVideos?: boolean
  }
  theme?: EventTheme | null
  onJoin?: (eventId: string) => void
  onLeave?: (eventId: string) => void
  onShare?: (event: any) => void
  showFullDetails?: boolean // For detailed view on individual event page
  onViewDetails?: (eventId: string) => void // Callback for viewing details
}

export function ThemedEventCard({ event, theme, onJoin, onLeave, onShare, showFullDetails = false, onViewDetails }: ThemedEventCardProps) {
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

  // Default theme fallback
  const cardTheme = theme || {
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
    <Card 
      className={`overflow-hidden transition-all hover:scale-[1.02] ${getShadowClass(cardTheme.shadowIntensity)} border-0`}
      style={{
        borderRadius: `${cardTheme.borderRadius}px`,
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(10px)',
        fontFamily: cardTheme.fontFamily
      }}
    >
      {/* Themed Header */}
      <div 
        className="h-24 relative overflow-hidden"
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
        <div className="absolute inset-0 flex items-end p-4">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <h3 
                className="text-lg font-medium truncate"
                style={{ 
                  color: cardTheme.textColor,
                  fontWeight: cardTheme.fontWeight
                }}
              >
                {event.title}
              </h3>
              <div className="flex items-center gap-1 text-sm opacity-90">
                <span>by</span>
                <span 
                  className="font-medium"
                  style={{ color: cardTheme.accentColor }}
                >
                  @{event.createdByUsername}
                </span>
              </div>
            </div>
            
            {event.isInvite && (
              <Badge 
                className="text-xs px-2 py-1"
                style={{ 
                  backgroundColor: `${cardTheme.accentColor}20`,
                  color: cardTheme.textColor,
                  border: `1px solid ${cardTheme.accentColor}40`
                }}
              >
                Community
              </Badge>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div 
          className="absolute top-2 right-2 w-16 h-16 rounded-full opacity-10"
          style={{ backgroundColor: cardTheme.accentColor }}
        />
        <div 
          className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-20"
          style={{ backgroundColor: cardTheme.secondaryColor }}
        />
      </div>

      <CardContent className="p-4 space-y-3">
        <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
        
        {event.isInvite && event.inviteDescription && (
          <div 
            className="rounded-lg p-3 border"
            style={{ 
              backgroundColor: `${cardTheme.primaryColor}10`,
              borderColor: `${cardTheme.primaryColor}30`
            }}
          >
            <p 
              className="text-sm font-medium mb-1"
              style={{ color: cardTheme.accentColor }}
            >
              What you're invited to do:
            </p>
            <p className="text-sm" style={{ color: cardTheme.textColor }}>
              {event.inviteDescription}
            </p>
            {event.groupName && (
              <p 
                className="text-xs mt-2 opacity-80"
                style={{ color: cardTheme.accentColor }}
              >
                Join "{event.groupName}" community chat
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" style={{ color: cardTheme.accentColor }} />
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" style={{ color: cardTheme.accentColor }} />
            <span>{formatDate(event.date)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-4 w-4" style={{ color: cardTheme.accentColor }} />
            <span>{formatTime(event.time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="h-4 w-4" style={{ color: cardTheme.accentColor }} />
            <span>
              {event.currentParticipants}
              {event.maxParticipants && ` / ${event.maxParticipants}`}
              {" "}participants
            </span>
          </div>

          {event.hasJoined && event.hasVideos && (
            <div className="flex items-center gap-2 text-gray-400">
              <Video className="h-4 w-4" style={{ color: cardTheme.accentColor }} />
              <span>
                {event.videoCount || 0} video{(event.videoCount || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 gap-2 px-4 pb-4">
        {/* Video Access Button - only for joined users with videos */}
        {!showFullDetails && event.hasJoined && event.hasVideos && onViewDetails && (
          <Button
            onClick={() => onViewDetails(event.id)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            style={{ borderRadius: `${cardTheme.borderRadius}px` }}
            title={`View ${event.videoCount} video${(event.videoCount || 0) !== 1 ? 's' : ''}`}
          >
            <Video className="h-4 w-4" />
          </Button>
        )}

        {/* Main action button - View Details or Join/Leave */}
        {!showFullDetails && event.hasJoined && onViewDetails && (
          <Button
            onClick={() => onViewDetails(event.id)}
            className="flex-1 text-white font-medium"
            style={{
              backgroundColor: cardTheme.accentColor,
              borderRadius: `${cardTheme.borderRadius}px`
            }}
          >
            View Details
          </Button>
        )}

        {(!showFullDetails || !event.hasJoined) && (
          <Button
            onClick={() => event.hasJoined ? onLeave?.(event.id) : onJoin?.(event.id)}
            className={event.hasJoined && onViewDetails && !showFullDetails ? "flex-1" : "flex-1 text-white font-medium"}
            style={{
              backgroundColor: event.hasJoined ? '#dc2626' : cardTheme.primaryColor,
              borderRadius: `${cardTheme.borderRadius}px`
            }}
            disabled={!event.hasJoined && event.maxParticipants ? event.currentParticipants >= event.maxParticipants : false}
          >
            {!event.hasJoined && event.maxParticipants && event.currentParticipants >= event.maxParticipants
              ? "Full"
              : event.hasJoined
                ? (showFullDetails ? "Leave Event" : "Leave")
                : "Join"
            }
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => onShare?.(event)}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
          style={{ borderRadius: `${cardTheme.borderRadius}px` }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
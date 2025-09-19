"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Star, StarOff, Play } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EventVideo {
  id: number
  eventId: number
  videoUrl: string
  thumbnailUrl?: string
  title?: string
  description?: string
  isPublic: boolean
  uploadedAt: string
}

interface VideoThumbnailSelectorProps {
  eventId: string
  currentThumbnailVideoUrl?: string
  onThumbnailChanged?: (videoUrl: string | null, imageUrl: string | null) => void
  className?: string
}

export function VideoThumbnailSelector({ 
  eventId, 
  currentThumbnailVideoUrl,
  onThumbnailChanged,
  className = ""
}: VideoThumbnailSelectorProps) {
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [loading, setLoading] = useState(true)

  // Load videos
  const loadVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/videos`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      } else {
        console.error('Failed to load videos:', response.status)
      }
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [eventId])

  // Set video as thumbnail
  const setAsThumbnail = async (video: EventVideo) => {
    try {
      const response = await fetch(`/api/events/${eventId}/thumbnail`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId: video.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Thumbnail Set",
          description: "This video is now the event thumbnail for sharing!",
        })
        onThumbnailChanged?.(video.videoUrl, video.thumbnailUrl || null)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to set thumbnail",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error setting thumbnail:', error)
      toast({
        title: "Error",
        description: "Failed to set thumbnail",
        variant: "destructive",
      })
    }
  }

  // Remove thumbnail
  const removeThumbnail = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/thumbnail`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast({
          title: "Thumbnail Removed",
          description: "Event thumbnail has been removed.",
        })
        onThumbnailChanged?.(null, null)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove thumbnail",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing thumbnail:', error)
      toast({
        title: "Error",
        description: "Failed to remove thumbnail",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-sm text-gray-400">Loading videos...</div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm text-gray-400">No videos uploaded yet</div>
        <div className="text-xs text-gray-500 mt-1">Upload videos to set one as thumbnail</div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium text-white mb-3">
        Select Video Thumbnail for Sharing
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
        {videos.map((video) => {
          const isThumbnail = currentThumbnailVideoUrl === video.videoUrl
          
          return (
            <Card 
              key={video.id} 
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:bg-gray-750 ${
                isThumbnail ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => isThumbnail ? removeThumbnail() : setAsThumbnail(video)}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Video Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-12 bg-gray-700 rounded overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title || 'Video thumbnail'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {isThumbnail && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {video.title || 'Untitled Video'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {video.isPublic ? 'Public' : 'Private'}
                    </div>
                    {isThumbnail && (
                      <Badge className="text-xs mt-1 bg-yellow-600 text-white">
                        Current Thumbnail
                      </Badge>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`p-1 ${isThumbnail ? 'text-yellow-400' : 'text-gray-400'} hover:text-white`}
                    >
                      {isThumbnail ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Current Thumbnail Info */}
      {currentThumbnailVideoUrl && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-400">Event Thumbnail Set</div>
              <div className="text-xs text-yellow-300 mt-1">
                This video will be used as the thumbnail when sharing the event
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={removeThumbnail}
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
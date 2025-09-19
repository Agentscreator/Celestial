"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Video, Star, StarOff, Play, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { EventVideoUpload } from "./EventVideoUpload"

interface EventVideo {
  id: number
  eventId: number
  videoUrl: string
  thumbnailUrl?: string
  title?: string
  description?: string
  duration?: number
  fileSize?: number
  mimeType: string
  isPublic: boolean
  uploadedAt: string
  uploadedBy: string
  uploader: {
    username: string
    nickname?: string
    profileImage?: string
  }
}

interface EventVideoManagerProps {
  eventId: string
  isEventCreator: boolean
  currentThumbnailVideoUrl?: string
  onThumbnailChanged?: (videoUrl: string | null, imageUrl: string | null) => void
}

export function EventVideoManager({ 
  eventId, 
  isEventCreator, 
  currentThumbnailVideoUrl,
  onThumbnailChanged 
}: EventVideoManagerProps) {
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

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
    if (isOpen) {
      loadVideos()
    }
  }, [isOpen, eventId])

  // Handle video upload
  const handleVideoUploaded = (video: EventVideo) => {
    setVideos(prev => [video, ...prev])
    toast({
      title: "Video Uploaded",
      description: "Your video has been added to the event!",
    })
  }

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

  // Delete video
  const deleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== videoId))
        toast({
          title: "Video Deleted",
          description: "The video has been removed from the event.",
        })

        // If this was the thumbnail video, remove thumbnail
        const deletedVideo = videos.find(v => v.id === videoId)
        if (deletedVideo && currentThumbnailVideoUrl === deletedVideo.videoUrl) {
          onThumbnailChanged?.(null, null)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete video",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      })
    }
  }

  // Toggle video visibility
  const toggleVideoVisibility = async (videoId: number, currentIsPublic: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isPublic: !currentIsPublic,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, isPublic: data.video.isPublic } : v
        ))
        toast({
          title: "Visibility Updated",
          description: `Video is now ${!currentIsPublic ? 'public' : 'private'}.`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update visibility",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      })
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
          <Video className="h-4 w-4 mr-2" />
          Manage Videos ({videos.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Event Videos</span>
            <EventVideoUpload eventId={eventId} onVideoUploaded={handleVideoUploaded}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Video className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </EventVideoUpload>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No videos uploaded yet</p>
              <EventVideoUpload eventId={eventId} onVideoUploaded={handleVideoUploaded}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Video className="h-4 w-4 mr-2" />
                  Upload First Video
                </Button>
              </EventVideoUpload>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => {
                const isThumbnail = currentThumbnailVideoUrl === video.videoUrl
                
                return (
                  <Card key={video.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Video Thumbnail/Preview */}
                        <div className="relative flex-shrink-0">
                          <div className="w-32 h-20 bg-gray-700 rounded-lg overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title || 'Video thumbnail'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {isThumbnail && (
                            <div className="absolute -top-2 -right-2">
                              <Badge className="bg-yellow-600 text-white text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Thumbnail
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">
                                {video.title || 'Untitled Video'}
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                By {video.uploader.nickname || video.uploader.username}
                              </p>
                              {video.description && (
                                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                  {video.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>{formatDuration(video.duration)}</span>
                                <span>{formatFileSize(video.fileSize)}</span>
                                <div className="flex items-center gap-1">
                                  {video.isPublic ? (
                                    <>
                                      <Eye className="h-3 w-3" />
                                      Public
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3 w-3" />
                                      Private
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-4">
                              {/* Play Video */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(video.videoUrl, '_blank')}
                                className="text-gray-400 hover:text-white"
                              >
                                <Play className="h-4 w-4" />
                              </Button>

                              {/* Toggle Visibility (for video uploader or event creator) */}
                              {(isEventCreator || video.uploadedBy === 'current-user') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleVideoVisibility(video.id, video.isPublic)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {video.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              )}

                              {/* Set as Thumbnail (only for event creator) */}
                              {isEventCreator && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => isThumbnail ? removeThumbnail() : setAsThumbnail(video)}
                                  className={isThumbnail ? "text-yellow-400 hover:text-yellow-300" : "text-gray-400 hover:text-white"}
                                >
                                  {isThumbnail ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                </Button>
                              )}

                              {/* Delete Video (for video uploader or event creator) */}
                              {(isEventCreator || video.uploadedBy === 'current-user') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteVideo(video.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Current Thumbnail Info */}
          {isEventCreator && currentThumbnailVideoUrl && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-yellow-400">Event Thumbnail</h4>
                  <p className="text-xs text-yellow-300 mt-1">
                    This video will be used as the thumbnail when sharing the event
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={removeThumbnail}
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                >
                  Remove Thumbnail
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
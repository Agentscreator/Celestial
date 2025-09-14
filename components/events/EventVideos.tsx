"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Video, Play, MoreVertical, Edit, Trash2, Eye, EyeOff, Clock, FileText, User, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { TypingAnimation } from "@/components/typing-animation"

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
  canEdit: boolean
  canDelete: boolean
}

interface EventVideosProps {
  eventId: string
  refreshTrigger?: number // For triggering refresh from parent
}

export function EventVideos({ eventId, refreshTrigger }: EventVideosProps) {
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<EventVideo | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    isPublic: true
  })

  // Load videos from API
  const loadVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/videos`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      } else if (response.status === 404) {
        // Event not found or no access
        setVideos([])
      } else {
        console.error('Failed to load videos:', response.status)
        toast({
          title: "Error",
          description: "Failed to load videos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading videos:', error)
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [eventId, refreshTrigger])

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format upload date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Handle video play
  const handlePlayVideo = (video: EventVideo) => {
    setSelectedVideo(video)
    setIsVideoPlayerOpen(true)
  }

  // Handle video edit
  const handleEditVideo = (video: EventVideo) => {
    setSelectedVideo(video)
    setEditForm({
      title: video.title || "",
      description: video.description || "",
      isPublic: video.isPublic
    })
    setIsEditDialogOpen(true)
  }

  // Submit video edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVideo) return

    try {
      const response = await fetch(`/api/events/${eventId}/videos/${selectedVideo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const data = await response.json()

        // Update the video in the list
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video.id === selectedVideo.id ? { ...video, ...data.video } : video
          )
        )

        toast({
          title: "Success",
          description: "Video updated successfully!",
        })
        setIsEditDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Update Failed",
          description: errorData.error || "Failed to update video.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the video.",
        variant: "destructive",
      })
    }
  }

  // Handle video delete
  const handleDeleteVideo = async (video: EventVideo) => {
    if (!confirm(`Are you sure you want to delete "${video.title || 'this video'}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/videos/${video.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        // Remove video from list
        setVideos(prevVideos => prevVideos.filter(v => v.id !== video.id))

        toast({
          title: "Success",
          description: "Video deleted successfully!",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Delete Failed",
          description: errorData.error || "Failed to delete video.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the video.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <TypingAnimation />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-400 mb-2">No videos yet</div>
        <p className="text-sm text-gray-500">Event participants can upload and share videos here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Event Videos ({videos.length})
        </h3>
      </div>

      {/* Videos Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="bg-gray-800/50 border-gray-700 overflow-hidden">
            <div className="relative group cursor-pointer" onClick={() => handlePlayVideo(video)}>
              {/* Video Thumbnail/Preview */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title || "Video thumbnail"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-blue-600 rounded-full p-3">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Privacy Indicator */}
                <div className="absolute top-2 left-2">
                  {video.isPublic ? (
                    <Eye className="h-4 w-4 text-green-400" title="Public video" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-yellow-400" title="Private video" />
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">
                    {video.title || 'Untitled Video'}
                  </h4>

                  {video.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {video.uploader.nickname || video.uploader.username}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(video.uploadedAt)}
                    </span>
                  </div>

                  {video.fileSize && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(video.fileSize)}
                    </div>
                  )}
                </div>

                {/* Action Menu */}
                {(video.canEdit || video.canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                      {video.canEdit && (
                        <DropdownMenuItem
                          onClick={() => handleEditVideo(video)}
                          className="hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {video.canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteVideo(video)}
                          className="hover:bg-red-900/50 text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVideo?.title || 'Video Player'}
            </DialogTitle>
          </DialogHeader>

          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedVideo.videoUrl}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              </div>

              {selectedVideo.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-300">Description</Label>
                  <p className="text-gray-400 mt-1">{selectedVideo.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>By {selectedVideo.uploader.nickname || selectedVideo.uploader.username}</span>
                <span>{formatDate(selectedVideo.uploadedAt)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Video title..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Video description..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Public Video</Label>
                <p className="text-sm text-gray-400">Allow all event participants to see this video</p>
              </div>
              <Switch
                checked={editForm.isPublic}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isPublic: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
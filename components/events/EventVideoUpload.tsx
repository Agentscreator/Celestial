"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Upload, Camera, Video, Loader2, X, Play, Pause } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"

interface EventVideoUploadProps {
  eventId: string
  onVideoUploaded?: (video: any) => void
  children?: React.ReactNode
}

export function EventVideoUpload({ eventId, onVideoUploaded, children }: EventVideoUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'camera' | 'url'>('file')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    isPublic: true
  })

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Camera permissions
  const { getCameraStreamWithPermission } = useCameraPermissions()

  // Start camera recording
  const startRecording = useCallback(async () => {
    try {

      // Get camera stream with permissions
      const stream = await getCameraStreamWithPermission({
        facingMode: 'user',
        audioEnabled: true
      })

      if (!stream) {
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
          variant: "destructive",
        })
        return
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Set up MediaRecorder
      recordedChunksRef.current = []
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        })
        setRecordedBlob(blob)

        // Create preview URL
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      })
    }
  }, [getCameraStreamWithPermission])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [isRecording])

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File",
          description: "Please select a video file.",
          variant: "destructive",
        })
        return
      }

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setRecordedBlob(file)

      // Auto-fill title from filename
      if (!formData.title) {
        const filename = file.name.replace(/\.[^/.]+$/, "")
        setFormData(prev => ({ ...prev, title: filename }))
      }
    }
  }

  // Upload video file to storage (placeholder - implement with your storage solution)
  const uploadVideoFile = async (file: Blob): Promise<{ videoUrl: string; thumbnailUrl?: string; duration?: number; fileSize: number }> => {
    // This is a placeholder. In a real implementation, you would:
    // 1. Upload the file to your cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Generate a thumbnail if needed
    // 3. Get video duration
    // 4. Return the URLs and metadata

    // For now, we'll simulate an upload and return a mock URL
    // In production, replace this with your actual upload logic

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate upload
        const mockVideoUrl = `https://example.com/videos/${Date.now()}.webm`
        const mockThumbnailUrl = `https://example.com/thumbnails/${Date.now()}.jpg`

        resolve({
          videoUrl: mockVideoUrl,
          thumbnailUrl: mockThumbnailUrl,
          duration: Math.floor(Math.random() * 300), // Random duration for demo
          fileSize: file.size
        })
      }, 2000) // Simulate 2 second upload
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let videoUrl = formData.videoUrl
      let thumbnailUrl: string | undefined
      let duration: number | undefined
      let fileSize: number | undefined

      // Handle different upload methods
      if (uploadMethod === 'file' || uploadMethod === 'camera') {
        if (!recordedBlob) {
          toast({
            title: "Error",
            description: "Please select a video file or record a video.",
            variant: "destructive",
          })
          return
        }

        // Upload the file
        toast({
          title: "Uploading",
          description: "Uploading your video...",
        })

        const uploadResult = await uploadVideoFile(recordedBlob)
        videoUrl = uploadResult.videoUrl
        thumbnailUrl = uploadResult.thumbnailUrl
        duration = uploadResult.duration
        fileSize = uploadResult.fileSize

      } else if (uploadMethod === 'url') {
        if (!videoUrl.trim()) {
          toast({
            title: "Error",
            description: "Please enter a video URL.",
            variant: "destructive",
          })
          return
        }

        // Validate URL
        try {
          new URL(videoUrl)
        } catch {
          toast({
            title: "Error",
            description: "Please enter a valid video URL.",
            variant: "destructive",
          })
          return
        }
      }

      // Upload to event
      const response = await fetch(`/api/events/${eventId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl,
          thumbnailUrl,
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          duration,
          fileSize,
          mimeType: recordedBlob?.type || 'video/mp4',
          isPublic: formData.isPublic,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Video uploaded successfully!",
        })

        onVideoUploaded?.(data.video)
        handleClose()
      } else {
        const errorData = await response.json()
        toast({
          title: "Upload Failed",
          description: errorData.error || "Failed to upload video.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the video.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Clean up and close dialog
  const handleClose = () => {
    setIsOpen(false)
    setFormData({ title: "", description: "", videoUrl: "", isPublic: true })
    setUploadMethod('file')
    setRecordedBlob(null)
    setPreviewUrl(null)
    setIsRecording(false)
    setRecordingTime(0)

    // Clean up recording
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Video className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Video to Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Method Selection */}
          <div>
            <Label className="text-base font-medium">Upload Method</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={uploadMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('file')}
                className={uploadMethod === 'file' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <Upload className="h-4 w-4 mr-1" />
                File
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('camera')}
                className={uploadMethod === 'camera' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <Camera className="h-4 w-4 mr-1" />
                Record
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('url')}
                className={uploadMethod === 'url' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <Video className="h-4 w-4 mr-1" />
                URL
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {uploadMethod === 'file' && (
            <div>
              <Label htmlFor="video-file">Select Video File</Label>
              <input
                ref={fileInputRef}
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-2 border-gray-600 text-white hover:bg-gray-800"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Video File
              </Button>
            </div>
          )}

          {/* Camera Recording */}
          {uploadMethod === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    REC {formatTime(recordingTime)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                {!isRecording ? (
                  <Button
                    type="button"
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <div>
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
                className="bg-gray-800 border-gray-600 text-white mt-2"
              />
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div>
              <Label className="text-base font-medium">Preview</Label>
              <div className="relative bg-gray-800 rounded-lg overflow-hidden mt-2" style={{ aspectRatio: '16/9' }}>
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              </div>
            </div>
          )}

          {/* Video Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Title (optional)</Label>
              <Input
                id="video-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your video a title..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="video-description">Description (optional)</Label>
              <Textarea
                id="video-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your video..."
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
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={uploading || (!recordedBlob && uploadMethod !== 'url') || (uploadMethod === 'url' && !formData.videoUrl.trim())}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
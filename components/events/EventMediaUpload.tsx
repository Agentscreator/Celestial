"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Upload, Camera, Video, Image, Loader2, X, Play, Pause } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"

interface EventMediaUploadProps {
  eventId?: string
  onMediaUploaded?: (media: any) => void
  children?: React.ReactNode
  allowPreCreation?: boolean // Allow media upload before event is created
}

export function EventMediaUpload({ eventId, onMediaUploaded, children, allowPreCreation = false }: EventMediaUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'camera' | 'url'>('file')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaUrl: "",
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
        audioEnabled: mediaType === 'video'
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

      if (mediaType === 'video') {
        // Set up MediaRecorder for video
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
      } else {
        // Take photo
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        if (videoRef.current && context) {
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          context.drawImage(videoRef.current, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              setRecordedBlob(blob)
              const url = URL.createObjectURL(blob)
              setPreviewUrl(url)
            }
          }, 'image/jpeg', 0.9)
        }

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }

    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Please try again.",
        variant: "destructive",
      })
    }
  }, [getCameraStreamWithPermission, mediaType])

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
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid File",
          description: "Please select an image or video file.",
          variant: "destructive",
        })
        return
      }

      // Update media type based on file
      setMediaType(isImage ? 'image' : 'video')

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

  // Upload media file to storage (placeholder - implement with your storage solution)
  const uploadMediaFile = async (file: Blob): Promise<{ 
    mediaUrl: string; 
    thumbnailUrl?: string; 
    duration?: number; 
    width?: number;
    height?: number;
    fileSize: number;
    mediaType: string;
    mimeType: string;
  }> => {
    // This is a placeholder. In a real implementation, you would:
    // 1. Upload the file to your cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Generate a thumbnail if needed
    // 3. Get media dimensions and duration
    // 4. Return the URLs and metadata

    return new Promise((resolve) => {
      setTimeout(() => {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const isGif = file.type === 'image/gif'
        
        let mediaType = 'image'
        if (isVideo) mediaType = 'video'
        else if (isGif) mediaType = 'gif'

        const mockMediaUrl = `https://example.com/${mediaType}s/${Date.now()}.${isVideo ? 'webm' : isGif ? 'gif' : 'jpg'}`
        const mockThumbnailUrl = isVideo ? `https://example.com/thumbnails/${Date.now()}.jpg` : undefined

        resolve({
          mediaUrl: mockMediaUrl,
          thumbnailUrl: mockThumbnailUrl,
          duration: isVideo ? Math.floor(Math.random() * 300) : undefined,
          width: Math.floor(Math.random() * 1000) + 500,
          height: Math.floor(Math.random() * 800) + 400,
          fileSize: file.size,
          mediaType,
          mimeType: file.type
        })
      }, 2000) // Simulate 2 second upload
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let mediaUrl = formData.mediaUrl
      let thumbnailUrl: string | undefined
      let duration: number | undefined
      let width: number | undefined
      let height: number | undefined
      let fileSize: number | undefined
      let detectedMediaType = mediaType
      let mimeType = 'image/jpeg'

      // Handle different upload methods
      if (uploadMethod === 'file' || uploadMethod === 'camera') {
        if (!recordedBlob) {
          toast({
            title: "Error",
            description: "Please select a file or capture media.",
            variant: "destructive",
          })
          return
        }

        // Upload the file
        toast({
          title: "Uploading",
          description: "Uploading your media...",
        })

        const uploadResult = await uploadMediaFile(recordedBlob)
        mediaUrl = uploadResult.mediaUrl
        thumbnailUrl = uploadResult.thumbnailUrl
        duration = uploadResult.duration
        width = uploadResult.width
        height = uploadResult.height
        fileSize = uploadResult.fileSize
        detectedMediaType = uploadResult.mediaType as 'image' | 'video'
        mimeType = uploadResult.mimeType

      } else if (uploadMethod === 'url') {
        if (!mediaUrl.trim()) {
          toast({
            title: "Error",
            description: "Please enter a media URL.",
            variant: "destructive",
          })
          return
        }

        // Validate URL
        try {
          new URL(mediaUrl)
        } catch {
          toast({
            title: "Error",
            description: "Please enter a valid media URL.",
            variant: "destructive",
          })
          return
        }

        // Detect media type from URL
        const url = mediaUrl.toLowerCase()
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
          detectedMediaType = 'video'
          mimeType = 'video/mp4'
        } else if (url.includes('.gif')) {
          detectedMediaType = 'image'
          mimeType = 'image/gif'
        } else {
          detectedMediaType = 'image'
          mimeType = 'image/jpeg'
        }
      }

      // Upload to event or store temporarily if no eventId
      let response: Response
      
      if (eventId) {
        response = await fetch(`/api/events/${eventId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            mediaUrl,
            thumbnailUrl,
            title: formData.title.trim() || null,
            description: formData.description.trim() || null,
            mediaType: detectedMediaType,
            duration,
            width,
            height,
            fileSize,
            mimeType,
            isPublic: formData.isPublic,
          }),
        })
      } else if (allowPreCreation) {
        // For pre-creation uploads, just return the media data
        const mediaData = {
          mediaUrl,
          thumbnailUrl,
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          mediaType: detectedMediaType,
          duration,
          width,
          height,
          fileSize,
          mimeType,
          isPublic: formData.isPublic,
        }
        
        toast({
          title: "Media Ready",
          description: "Media prepared for event creation.",
        })

        onMediaUploaded?.(mediaData)
        handleClose()
        return
      } else {
        throw new Error("Event ID is required for media upload")
      }

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Media uploaded successfully!",
        })

        onMediaUploaded?.(data.media)
        handleClose()
      } else {
        const errorData = await response.json()
        toast({
          title: "Upload Failed",
          description: errorData.error || "Failed to upload media.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the media.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Clean up and close dialog
  const handleClose = () => {
    setIsOpen(false)
    setFormData({ title: "", description: "", mediaUrl: "", isPublic: true })
    setUploadMethod('file')
    setMediaType('image')
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
            <Image className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Media to Event</DialogTitle>
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
                Camera
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('url')}
                className={uploadMethod === 'url' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <Image className="h-4 w-4 mr-1" />
                URL
              </Button>
            </div>
          </div>

          {/* Media Type Selection for Camera */}
          {uploadMethod === 'camera' && (
            <div>
              <Label className="text-base font-medium">Media Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={mediaType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMediaType('image')}
                  className={mediaType === 'image' ? 'bg-blue-600' : 'border-gray-600'}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Photo
                </Button>
                <Button
                  type="button"
                  variant={mediaType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMediaType('video')}
                  className={mediaType === 'video' ? 'bg-blue-600' : 'border-gray-600'}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Video
                </Button>
              </div>
            </div>
          )}

          {/* File Upload */}
          {uploadMethod === 'file' && (
            <div>
              <Label htmlFor="media-file">Select Media File</Label>
              <input
                ref={fileInputRef}
                id="media-file"
                type="file"
                accept="image/*,video/*"
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
                Choose Image or Video
              </Button>
            </div>
          )}

          {/* Camera Capture */}
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
                {!isRecording && !recordedBlob ? (
                  <Button
                    type="button"
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {mediaType === 'image' ? 'Take Photo' : 'Start Recording'}
                  </Button>
                ) : isRecording ? (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setRecordedBlob(null)
                      setPreviewUrl(null)
                    }}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <div>
              <Label htmlFor="media-url">Media URL</Label>
              <Input
                id="media-url"
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg or video.mp4"
                className="bg-gray-800 border-gray-600 text-white mt-2"
              />
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div>
              <Label className="text-base font-medium">Preview</Label>
              <div className="relative bg-gray-800 rounded-lg overflow-hidden mt-2" style={{ aspectRatio: '16/9' }}>
                {mediaType === 'video' || (recordedBlob && recordedBlob.type.startsWith('video/')) ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Media Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-title">Title (optional)</Label>
              <Input
                id="media-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your media a title..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="media-description">Description (optional)</Label>
              <Textarea
                id="media-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your media..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Public Media</Label>
                <p className="text-sm text-gray-400">Allow all event participants to see this media</p>
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
              disabled={uploading || (!recordedBlob && uploadMethod !== 'url') || (uploadMethod === 'url' && !formData.mediaUrl.trim())}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
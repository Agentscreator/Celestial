"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Upload, X, Loader2, Camera, Square, RotateCw, Mic, MicOff, Music, Zap, Filter, Sparkles, Timer, Flashlight as Flash } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface NewPostCreatorProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: (post: any) => void
}

export function NewPostCreator({ isOpen, onClose, onPostCreated }: NewPostCreatorProps) {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preview'>('camera')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState<'15s' | '60s' | '3m'>('15s')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: facingMode
        },
        audio: audioEnabled
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setCameraReady(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }, [facingMode, audioEnabled])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type - only videos allowed
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setMode('preview')
    }
  }

  // Get max recording duration in seconds
  const getMaxDuration = () => {
    switch (selectedDuration) {
      case '15s': return 15
      case '60s': return 60
      case '3m': return 180
      default: return 15
    }
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      recordedChunksRef.current = []
      const mediaRecorder = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        setSelectedFile(new File([blob], 'recorded-video.webm', { type: 'video/webm' }))
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setMode('preview')
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Recording timer with auto-stop at max duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= getMaxDuration()) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive",
      })
    }
  }, [selectedDuration])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Flip camera
  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Create post
  const handleCreatePost = async () => {
    if (!caption.trim()) {
      toast({
        title: "Description required",
        description: "Please add a description for your post",
        variant: "destructive",
      })
      return
    }

    if (!selectedFile) {
      toast({
        title: "Media required",
        description: "Please record a video or upload a file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('content', caption.trim())
      formData.append('media', selectedFile)
      formData.append('isInvite', 'false')

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        
        toast({
          title: "Success!",
          description: "Your post has been created",
        })
        
        // Clear form
        setCaption("")
        setSelectedFile(null)
        setPreviewUrl(null)
        
        // Notify parent and close
        onPostCreated?.(result.post)
        onClose()
        
        // Refresh feed
        window.dispatchEvent(new CustomEvent('postCreated'))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Close and cleanup
  const handleClose = () => {
    setCaption("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setIsRecording(false)
    setRecordingTime(0)
    setMode('camera')
    setShowCaption(false)
    stopCamera()
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    
    onClose()
  }

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Initialize camera when dialog opens and in camera mode
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      initCamera()
    } else {
      stopCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, mode, initCamera, stopCamera])

  // Re-initialize camera when settings change
  useEffect(() => {
    if (cameraReady && mode === 'camera') {
      stopCamera()
      setTimeout(initCamera, 100)
    }
  }, [facingMode, audioEnabled, cameraReady, mode, initCamera, stopCamera])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-[100vw] h-[100vh] max-w-none max-h-none p-0 bg-black border-none rounded-none"
        hideTitle={true}
        title="Create New Post"
        description="Create and share a new video post"
      >
        
        {mode === 'camera' && (
          // TikTok-style Camera Interface
          <div className="relative w-full h-full bg-black overflow-hidden">
            {/* Camera Preview */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
              muted
              playsInline
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white hover:bg-white/10 rounded-full p-2"
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                className="bg-black/30 text-white hover:bg-black/50 rounded-full px-4 py-2"
              >
                <Music className="h-4 w-4 mr-2" />
                Add sound
              </Button>
              
              <div className="w-8" /> {/* Spacer for balance */}
            </div>

            {/* Recording Timer */}
            {isRecording && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {/* Right Side Controls */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-6">
              {/* Flip Camera */}
              <button
                onClick={flipCamera}
                className="flex flex-col items-center text-white"
              >
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1">
                  <RotateCw className="w-6 h-6" />
                </div>
                <span className="text-xs">Flip</span>
              </button>

              {/* Speed */}
              <button className="flex flex-col items-center text-white">
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs">Speed</span>
              </button>

              {/* Filters */}
              <button className="flex flex-col items-center text-white">
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1">
                  <Filter className="w-6 h-6" />
                </div>
                <span className="text-xs">Filters</span>
              </button>

              {/* Beauty */}
              <button className="flex flex-col items-center text-white">
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs">Beauty</span>
              </button>

              {/* Timer */}
              <button className="flex flex-col items-center text-white">
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1">
                  <Timer className="w-6 h-6" />
                </div>
                <span className="text-xs">Timer</span>
              </button>

              {/* Flash */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="flex flex-col items-center text-white"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                  flashEnabled ? "bg-yellow-500" : "bg-black/30"
                )}>
                  <Flash className="w-6 h-6" />
                </div>
                <span className="text-xs">Flash</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
              {/* Duration Selector */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-black/30 rounded-full p-1">
                  {(['3m', '60s', '15s'] as const).map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedDuration === duration
                          ? "bg-white text-black"
                          : "text-white hover:bg-white/10"
                      )}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-8">
                {/* Effects */}
                <button className="flex flex-col items-center text-white">
                  <div className="w-14 h-14 bg-black/30 rounded-2xl flex items-center justify-center mb-1">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Effects</span>
                </button>

                {/* Record Button */}
                <div className="relative">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!cameraReady}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500 rounded-full" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                    >
                      <Square className="w-8 h-8 text-white fill-current" />
                    </button>
                  )}
                  
                  {/* Progress Ring */}
                  {isRecording && (
                    <div className="absolute inset-0 -rotate-90">
                      <svg className="w-20 h-20">
                        <circle
                          cx="40"
                          cy="40"
                          r="38"
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${(recordingTime / getMaxDuration()) * 238.76} 238.76`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center text-white"
                >
                  <div className="w-14 h-14 bg-black/30 rounded-2xl flex items-center justify-center mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Upload</span>
                </button>
              </div>

              {/* Bottom Tab Bar */}
              <div className="flex justify-center mt-6">
                <div className="flex bg-black/30 rounded-full px-6 py-2">
                  <button className="text-white font-medium mr-8">Camera</button>
                  <button className="text-white/60">Templates</button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {mode === 'preview' && (
          // Preview Mode with Caption
          <div className="relative w-full h-full bg-black">
            {/* Video Preview */}
            <video
              src={previewUrl || undefined}
              className="w-full h-full object-cover"
              controls={false}
              autoPlay
              loop
              muted
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setMode('camera')
                  removeFile()
                }}
                className="text-white hover:bg-white/10 rounded-full p-2"
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                className="bg-black/30 text-white hover:bg-black/50 rounded-full px-4 py-2"
              >
                <Music className="h-4 w-4 mr-2" />
                Add sound
              </Button>
              
              <Button
                onClick={() => setShowCaption(!showCaption)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
              >
                Next
              </Button>
            </div>

            {/* Caption Overlay */}
            {showCaption && (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your video..."
                  className="w-full bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 resize-none text-lg"
                  maxLength={2000}
                  rows={3}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-white/60 text-sm">{caption.length}/2000</span>
                  
                  <Button
                    onClick={handleCreatePost}
                    disabled={isUploading || !caption.trim()}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full px-8 py-2"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Posting...
                      </div>
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
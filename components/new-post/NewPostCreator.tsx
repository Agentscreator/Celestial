"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, Loader2, Camera, Square, RotateCw, Mic, MicOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface NewPostCreatorProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: (post: any) => void
}

export function NewPostCreator({ isOpen, onClose, onPostCreated }: NewPostCreatorProps) {
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [audioEnabled, setAudioEnabled] = useState(true)
  
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
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file",
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
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive",
      })
    }
  }, [])

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
    setMode('record')
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

  // Initialize camera when dialog opens and in record mode
  useEffect(() => {
    if (isOpen && mode === 'record') {
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
    if (cameraReady && mode === 'record') {
      stopCamera()
      setTimeout(initCamera, 100)
    }
  }, [facingMode, audioEnabled, cameraReady, mode, initCamera, stopCamera])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none p-0 bg-black border-none rounded-none sm:w-[95vw] sm:h-[95vh] sm:max-w-4xl sm:rounded-2xl">
        <DialogTitle className="sr-only">Create New Post</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 bg-gray-800 rounded-full p-1">
            <Button
              variant={mode === 'record' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('record')}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                mode === 'record' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <Camera className="h-4 w-4 mr-2" />
              Record
            </Button>
            <Button
              variant={mode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('upload')}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                mode === 'upload' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          <Button
            onClick={handleCreatePost}
            disabled={isUploading || !caption.trim() || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </div>
            ) : (
              "Share"
            )}
          </Button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {mode === 'record' ? (
              // Camera Recording View
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                  muted
                  playsInline
                />
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}

                {/* Camera Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={flipCamera}
                    className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={cn(
                      "w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50",
                      !audioEnabled && "bg-red-600"
                    )}
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Recording Button */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={!cameraReady}
                      className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full" />
                      </div>
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    >
                      <Square className="w-8 h-8 text-white fill-current" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              // Upload/Preview View
              <div className="w-full h-full flex flex-col items-center justify-center">
                {previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {selectedFile?.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        className="max-w-full max-h-full object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeFile}
                      className="absolute top-4 right-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 mx-auto">
                      <Upload className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Select Media</h2>
                    <p className="text-white/70 mb-8 max-w-md">
                      Choose a photo or video from your device
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description Panel */}
          <div className="w-full sm:w-80 bg-gray-900 p-4 flex flex-col">
            <h3 className="text-white font-semibold mb-4">Description</h3>
            
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 min-h-[120px] bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 resize-none"
              maxLength={2000}
            />
            
            <div className="text-xs text-gray-400 mt-2 text-right">
              {caption.length}/2000
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
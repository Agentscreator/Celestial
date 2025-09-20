"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FullscreenDialog } from "../new-post/FullscreenDialog"
import { Upload, X, Loader2, Camera, Square, RotateCw, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"

interface EventVideoCreatorProps {
  isOpen: boolean
  onClose: () => void
  onVideoCreated?: (videoData: { file: File; description: string }) => void
  eventTitle?: string
}

export function EventVideoCreator({ isOpen, onClose, onVideoCreated, eventTitle }: EventVideoCreatorProps) {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preview'>('camera')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [selectedDuration, setSelectedDuration] = useState<'15s' | '30s' | '60s' | '99s'>('99s')
  const [cameraLoading, setCameraLoading] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)

  // Use camera permissions hook
  const { getCameraStreamWithPermission } = useCameraPermissions()

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Stop camera function
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraLoading(false)
  }, [])

  // Initialize camera
  const initCamera = useCallback(async () => {
    if (cameraLoading) return

    setCameraLoading(true)
    setCameraReady(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    try {
      const stream = await getCameraStreamWithPermission({
        facingMode: facingMode,
        audioEnabled: true
      })

      if (!stream) {
        throw new Error('Failed to get camera stream')
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true)
            setCameraLoading(false)
          }).catch(err => {
            console.error('Error playing video:', err)
            setCameraLoading(false)
          })
        }
      }

    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraLoading(false)
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please try uploading a video instead.",
        variant: "destructive",
      })
    }
  }, [facingMode, getCameraStreamWithPermission])

  // Initialize camera when dialog opens
  useEffect(() => {
    if (isOpen && mode === 'camera' && !cameraReady && !cameraLoading) {
      initCamera()
    }
  }, [isOpen, mode, cameraReady, cameraLoading, initCamera])

  // Cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setMode('camera')
      setSelectedFile(null)
      setPreviewUrl(null)
      setDescription("")
      setIsRecording(false)
      setRecordingTime(0)
    }
  }, [isOpen, stopCamera])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video or image file",
          variant: "destructive",
        })
        return
      }

      const maxSize = 99 * 1024 * 1024 // 99MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 99MB",
          variant: "destructive",
        })
        return
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
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
      case '30s': return 30
      case '60s': return 60
      case '99s': return 99
      default: return 99
    }
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      recordedChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        setIsRecording(false)
        setIsStoppingRecording(false)

        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `event-video-${Date.now()}.webm`, { type: 'video/webm' })

        setSelectedFile(file)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setMode('preview')

        toast({
          title: "Recording complete!",
          description: "Your event video is ready for preview",
        })
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)

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
    if (isStoppingRecording || !isRecording) return

    setIsStoppingRecording(true)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording, isStoppingRecording])

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle video creation
  const handleCreateVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "No video selected",
        description: "Please record or upload a video, or close this dialog to skip video creation",
        variant: "destructive",
      })
      return
    }

    stopCamera()

    onVideoCreated?.({
      file: selectedFile,
      description: description.trim()
    })

    onClose()

    toast({
      title: "Video ready!",
      description: "Your event video has been prepared. Continue with event creation.",
    })
  }

  return (
    <FullscreenDialog isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col bg-black text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Create Event Video</h2>
              {eventTitle && (
                <p className="text-sm text-gray-400">for {eventTitle}</p>
              )}
            </div>
          </div>
          
          {mode === 'preview' && (
            <Button
              onClick={handleCreateVideo}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              Use Video
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {mode === 'camera' && (
            <div className="flex-1 relative">
              <div className="relative h-full bg-gray-900">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />

                {cameraLoading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                      <p className="text-white">Starting camera...</p>
                    </div>
                  </div>
                )}

                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>REC {formatTime(recordingTime)}</span>
                  </div>
                )}

                <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-2">
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value as '15s' | '30s' | '60s' | '99s')}
                    className="bg-transparent text-white text-sm border-none outline-none"
                    disabled={isRecording}
                  >
                    <option value="15s">15s</option>
                    <option value="30s">30s</option>
                    <option value="60s">60s</option>
                    <option value="99s">99s</option>
                  </select>
                </div>

                {cameraReady && (
                  <div className="absolute bottom-20 left-0 right-0 flex justify-center items-center space-x-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                      disabled={isRecording}
                      className="text-white hover:bg-white/20 p-3 rounded-full"
                    >
                      <RotateCw className="h-6 w-6" />
                    </Button>

                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isStoppingRecording}
                      className={cn(
                        "w-16 h-16 rounded-full border-4 border-white flex items-center justify-center",
                        isRecording 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-transparent hover:bg-white/20"
                      )}
                    >
                      {isRecording ? (
                        <Square className="h-6 w-6 text-white" />
                      ) : (
                        <div className="w-6 h-6 bg-red-600 rounded-full" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isRecording}
                      className="text-white hover:bg-white/20 p-3 rounded-full"
                    >
                      <Upload className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {!cameraLoading && !cameraReady && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-center max-w-sm mx-auto p-6">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Camera Unavailable</h3>
                      <p className="text-gray-400 mb-4">
                        Unable to access your camera. Please try uploading a video instead.
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Upload Video Instead
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {mode === 'preview' && previewUrl && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative bg-black">
                {selectedFile?.type.startsWith('video/') ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="p-4 bg-gray-900/80 backdrop-blur-sm">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for your event video..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {description.length}/500 characters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('camera')}
                    className="text-gray-400 hover:text-white"
                  >
                    Retake
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FullscreenDialog>
  )
}
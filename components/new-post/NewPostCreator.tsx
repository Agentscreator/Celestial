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
  const [speedMode, setSpeedMode] = useState<'0.5x' | '1x' | '2x' | '3x'>('1x')
  const [filterMode, setFilterMode] = useState<'none' | 'vintage' | 'dramatic' | 'bright' | 'warm'>('none')
  const [beautyMode, setBeautyMode] = useState(0) // 0-100
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerDuration, setTimerDuration] = useState<3 | 10>(3)
  const [showSpeedSelector, setShowSpeedSelector] = useState(false)
  const [showFilterSelector, setShowFilterSelector] = useState(false)
  const [showBeautySlider, setShowBeautySlider] = useState(false)
  const [showTimerSelector, setShowTimerSelector] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera
  const initCamera = useCallback(async () => {
    setCameraLoading(true)
    setCameraReady(false)
    
    try {
      console.log('Requesting camera access...')
      
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      const constraints = {
        video: {
          width: { ideal: 720, min: 480 },
          height: { ideal: 1280, min: 640 },
          facingMode: facingMode
        },
        audio: audioEnabled
      }

      console.log('Camera constraints:', constraints)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera stream obtained:', stream)
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          videoRef.current?.play().then(() => {
            console.log('Video playing')
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
      
      let errorMessage = "Unable to access camera. Please check permissions."
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access denied. Please allow camera permissions and try again."
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is already in use by another application."
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
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

  // Handle speed mode change
  const handleSpeedChange = (speed: '0.5x' | '1x' | '2x' | '3x') => {
    setSpeedMode(speed)
    setShowSpeedSelector(false)
    toast({
      title: "Speed changed",
      description: `Recording speed set to ${speed}`,
    })
  }

  // Handle filter change
  const handleFilterChange = (filter: 'none' | 'vintage' | 'dramatic' | 'bright' | 'warm') => {
    setFilterMode(filter)
    setShowFilterSelector(false)
    toast({
      title: "Filter applied",
      description: filter === 'none' ? 'Filter removed' : `${filter} filter applied`,
    })
  }

  // Handle beauty mode change
  const handleBeautyChange = (value: number) => {
    setBeautyMode(value)
    toast({
      title: "Beauty mode",
      description: value === 0 ? 'Beauty mode disabled' : `Beauty level: ${value}%`,
    })
  }

  // Handle timer toggle
  const handleTimerToggle = () => {
    setTimerEnabled(!timerEnabled)
    setShowTimerSelector(false)
    toast({
      title: timerEnabled ? "Timer disabled" : "Timer enabled",
      description: timerEnabled ? "Timer turned off" : `${timerDuration}s countdown enabled`,
    })
  }

  // Get filter CSS class
  const getFilterClass = () => {
    switch (filterMode) {
      case 'vintage': return 'sepia(0.8) contrast(1.2)'
      case 'dramatic': return 'contrast(1.5) saturate(1.3)'
      case 'bright': return 'brightness(1.2) saturate(1.1)'
      case 'warm': return 'sepia(0.3) saturate(1.2) hue-rotate(10deg)'
      default: return 'none'
    }
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
    setShowSpeedSelector(false)
    setShowFilterSelector(false)
    setShowBeautySlider(false)
    setShowTimerSelector(false)
    setCameraLoading(false)
    setCameraReady(false)
    stopCamera()
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    
    onClose()
  }

  // Close all selectors
  const closeAllSelectors = () => {
    setShowSpeedSelector(false)
    setShowFilterSelector(false)
    setShowBeautySlider(false)
    setShowTimerSelector(false)
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
        className="w-[100vw] h-[100vh] max-w-none max-h-none p-0 bg-black border-none rounded-none [&>button]:hidden"
        hideTitle={true}
        title="Create New Post"
        description="Create and share a new video post"
      >
        
        {mode === 'camera' && (
          // TikTok-style Camera Interface
          <div 
            className="relative w-full h-full bg-black overflow-hidden"
            onClick={closeAllSelectors}
          >
            {/* Camera Preview */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                filter: getFilterClass()
              }}
              muted
              playsInline
              autoPlay
            />

            {/* Camera Loading/Permission Overlay */}
            {(cameraLoading || !cameraReady) && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                {cameraLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <p className="text-white text-lg mb-2">Starting camera...</p>
                    <p className="text-white/70 text-sm text-center px-8">
                      Please allow camera access when prompted
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="w-16 h-16 text-white/50 mb-4" />
                    <p className="text-white text-lg mb-2">Camera not ready</p>
                    <p className="text-white/70 text-sm text-center px-8 mb-4">
                      Please check camera permissions and try again
                    </p>
                    <Button
                      onClick={initCamera}
                      className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-2"
                    >
                      Retry Camera
                    </Button>
                  </>
                )}
              </div>
            )}

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
                disabled={isRecording}
                className="flex flex-col items-center text-white disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center mb-1 hover:bg-black/50 transition-colors">
                  <RotateCw className="w-6 h-6" />
                </div>
                <span className="text-xs">Flip</span>
              </button>

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpeedSelector(!showSpeedSelector)
                  }}
                  className="flex flex-col items-center text-white"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors",
                    speedMode !== '1x' ? "bg-blue-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-xs">{speedMode}</span>
                </button>
                
                {showSpeedSelector && (
                  <div 
                    className="absolute right-14 top-0 bg-black/80 rounded-lg p-2 min-w-[80px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(['0.5x', '1x', '2x', '3x'] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "block w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors",
                          speedMode === speed ? "text-blue-400" : "text-white"
                        )}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFilterSelector(!showFilterSelector)
                  }}
                  className="flex flex-col items-center text-white"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors",
                    filterMode !== 'none' ? "bg-purple-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Filter className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Filters</span>
                </button>
                
                {showFilterSelector && (
                  <div 
                    className="absolute right-14 top-0 bg-black/80 rounded-lg p-2 min-w-[100px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(['none', 'vintage', 'dramatic', 'bright', 'warm'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={cn(
                          "block w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors capitalize",
                          filterMode === filter ? "text-purple-400" : "text-white"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Beauty */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBeautySlider(!showBeautySlider)
                  }}
                  className="flex flex-col items-center text-white"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors",
                    beautyMode > 0 ? "bg-pink-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Beauty</span>
                </button>
                
                {showBeautySlider && (
                  <div 
                    className="absolute right-14 top-0 bg-black/80 rounded-lg p-4 w-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-white text-sm mb-2">Beauty: {beautyMode}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={beautyMode}
                      onChange={(e) => handleBeautyChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTimerSelector(!showTimerSelector)
                  }}
                  className="flex flex-col items-center text-white"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors",
                    timerEnabled ? "bg-green-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Timer className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Timer</span>
                </button>
                
                {showTimerSelector && (
                  <div 
                    className="absolute right-14 top-0 bg-black/80 rounded-lg p-2 min-w-[80px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setTimerDuration(3)}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors",
                        timerDuration === 3 ? "text-green-400" : "text-white"
                      )}
                    >
                      3s
                    </button>
                    <button
                      onClick={() => setTimerDuration(10)}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors",
                        timerDuration === 10 ? "text-green-400" : "text-white"
                      )}
                    >
                      10s
                    </button>
                    <button
                      onClick={handleTimerToggle}
                      className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors text-green-400 border-t border-white/20 mt-1 pt-2"
                    >
                      {timerEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                )}
              </div>

              {/* Flash */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="flex flex-col items-center text-white"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-colors",
                  flashEnabled ? "bg-yellow-500" : "bg-black/30 hover:bg-black/50"
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
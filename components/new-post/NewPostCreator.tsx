"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FullscreenDialog } from "./FullscreenDialog"
import { Upload, X, Loader2, Camera, Square, RotateCw, Music, Zap, Filter, Sparkles, Flashlight as Flash } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"
import { playMessageSound } from "@/utils/sound"

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
  const [audioEnabled] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState<'15s' | '30s' | '60s' | '3m'>('30s')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  const [speedMode, setSpeedMode] = useState<'0.5x' | '1x' | '2x' | '3x'>('1x')
  const [filterMode, setFilterMode] = useState<'none' | 'vintage' | 'dramatic' | 'bright' | 'warm'>('none')
  const [showSpeedSelector, setShowSpeedSelector] = useState(false)
  const [showFilterSelector, setShowFilterSelector] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)

  // Use camera permissions hook
  const { hasPermission, isLoading: permissionLoading, getCameraStreamWithPermission, checkPermission } = useCameraPermissions()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordingMimeTypeRef = useRef<string>('video/webm')

  // Initialize camera with native permissions
  const initCamera = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (cameraLoading || permissionLoading) {
      return
    }

    setCameraLoading(true)
    setCameraReady(false)

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    try {

      // Use the hook to get camera stream with native permissions
      const stream = await getCameraStreamWithPermission({
        facingMode: facingMode,
        audioEnabled: audioEnabled
      })

      if (!stream) {
        throw new Error('Failed to get camera stream - permission may have been denied')
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true)
            setCameraLoading(false)
          }).catch(err => {
            console.error('Error playing video:', err)
            setCameraLoading(false)
            toast({
              title: "Camera Error",
              description: "Failed to start video preview. Please try again.",
              variant: "destructive",
            })
          })
        }

        // Add error handler for video element
        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err)
          setCameraLoading(false)
          setCameraReady(false)
        }
      }

    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraLoading(false)
      setCameraReady(false)

      // Show user-friendly error message
      let errorMessage = "Failed to access camera. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [facingMode, audioEnabled, cameraLoading, permissionLoading, getCameraStreamWithPermission])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraLoading(false)
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

      // Clean up any existing preview URL before creating new one
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
      case '3m': return 180
      default: return 30
    }
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return


    try {
      // Clean up any existing preview URL and file before starting new recording
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setSelectedFile(null)

      // Clear previous recording chunks
      recordedChunksRef.current = []
      // Try to create MediaRecorder with audio support
      // Try different codec combinations for audio+video support
      // Prioritize MP4 for better compatibility with blob storage
      const codecOptions = [
        'video/mp4',                   // MP4 first for better compatibility
        'video/webm;codecs=h264,opus', // H264 video + Opus audio
        'video/webm;codecs=vp8,opus',  // VP8 video + Opus audio
        'video/webm;codecs=vp9,opus',  // VP9 video + Opus audio
        'video/webm'                   // Default WebM fallback
      ]

      let mediaRecorder: MediaRecorder | null = null

      // Try to find a supported codec
      let codecFound = false
      for (const codec of codecOptions) {
        const isSupported = MediaRecorder.isTypeSupported(codec)
        if (isSupported) {
          mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: codec })
          recordingMimeTypeRef.current = codec
          codecFound = true
          break
        }
      }

      // Fallback if no specific codec is supported
      if (!codecFound) {
        mediaRecorder = new MediaRecorder(streamRef.current)
        recordingMimeTypeRef.current = 'video/mp4'
      }

      if (!mediaRecorder) {
        throw new Error('Failed to create MediaRecorder')
      }

      mediaRecorderRef.current = mediaRecorder

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false)
        setIsStoppingRecording(false)

        const mimeType = recordingMimeTypeRef.current
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })


        // Generate proper filename with extension based on MIME type
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const filename = `recorded-video-${Date.now()}.${extension}`


        const file = new File([blob], filename, { type: mimeType })
        setSelectedFile(file)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setMode('preview')


        toast({
          title: "Recording complete!",
          description: "Your video with audio is ready for preview",
        })
      }

      mediaRecorderRef.current.start()
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
    // Prevent double-clicks
    if (isStoppingRecording || !isRecording) {
      return
    }


    try {
      // Set stopping state to prevent double-clicks
      setIsStoppingRecording(true)

      // Clear the timer interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }

      // #TO DO 317-520

      // Stop the media recorder if it exists and is recording
      if (mediaRecorderRef.current) {
        const recorder = mediaRecorderRef.current

        if (recorder.state === 'recording') {
          recorder.stop()
          // Don't set isRecording to false here - let the onstop handler do it
        } else if (recorder.state === 'paused') {
          recorder.stop()
        } else {
          // If recorder is in an unexpected state, trigger the onstop handler manually
          setIsRecording(false)
          setIsStoppingRecording(false)
          if (recorder.onstop) {
            recorder.onstop(new Event('stop'))
          }
        }
      } else {
        setIsRecording(false)
        setIsStoppingRecording(false)
        toast({
          title: "Recording stopped",
          description: "Recording has been stopped",
        })
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      setIsRecording(false)
      setIsStoppingRecording(false)
      toast({
        title: "Recording Error",
        description: "There was an issue stopping the recording, but it has been stopped.",
        variant: "destructive",
      })
    }
  }, [isRecording, isStoppingRecording])

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
      console.log('🚀 Starting post creation...')
      console.log('Caption:', caption.trim())
      console.log('Selected file:', selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      } : 'No file')

      const formData = new FormData()
      formData.append('content', caption.trim())
      formData.append('media', selectedFile)
      formData.append('isInvite', 'false')

      console.log('FormData entries:')
      for (const [key, value] of formData.entries()) {
        console.log(`- ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value)
      }


      // Temporarily use debug endpoint to test
      console.log('🔍 Testing with debug endpoint first...')

      // Test with debug endpoint first (text only)
      const debugFormData = new FormData()
      debugFormData.append('content', caption.trim())

      const debugResponse = await fetch('/api/debug-posts', {
        method: 'POST',
        body: debugFormData,
      })

      console.log('Debug response status:', debugResponse.status)

      if (debugResponse.ok) {
        console.log('✅ Debug endpoint works, trying main endpoint...')
      } else {
        console.error('❌ Debug endpoint failed:', await debugResponse.text())
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })


      console.log('Main API response status:', response.status)
      console.log('Main API response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Post creation successful:', result)

        // Play success sound
        playMessageSound()

        toast({
          title: "Success!",
          description: "Your post has been created",
        })

        // Clear form and clean up blob URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setCaption("")
        setSelectedFile(null)
        setPreviewUrl(null)

        // Notify parent and close
        onPostCreated?.(result.post)
        onClose()

        // Refresh feed
        window.dispatchEvent(new CustomEvent('postCreated'))
      } else {
        const errorText = await response.text()
        console.error('❌ Post creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        })

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Failed to create post' }
        }

        // Show more specific error message
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`

        toast({
          title: "Post Creation Failed",
          description: errorMessage,
          variant: "destructive",
        })

        throw new Error(errorMessage)
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
    // Clean up blob URLs to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setCaption("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setIsRecording(false)
    setIsStoppingRecording(false)
    setRecordingTime(0)
    setMode('camera')
    setShowCaption(false)
    setShowSpeedSelector(false)
    setShowFilterSelector(false)
    setCameraLoading(false)
    setCameraReady(false)
    stopCamera()

    // Clear recorded chunks to ensure fresh recording
    recordedChunksRef.current = []

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
  }

  // Remove selected file
  const removeFile = () => {
    // Revoke the existing blob URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
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
  }, [isOpen, mode]) // Removed function dependencies to prevent infinite loop

  // Pause all feed videos when post creator opens
  useEffect(() => {
    if (isOpen) {
      // Dispatch event to pause all feed videos
      window.dispatchEvent(new CustomEvent('pauseAllFeedVideos'))
    } else {
      // Dispatch event to resume feed videos when closing
      window.dispatchEvent(new CustomEvent('resumeFeedVideos'))
    }
  }, [isOpen])

  // Re-initialize camera when settings change (but not on first load)
  useEffect(() => {
    if (cameraReady && mode === 'camera') {
      stopCamera()
      setTimeout(() => {
        initCamera()
      }, 100)
    }
  }, [facingMode, audioEnabled]) // Only depend on the actual settings, not the functions

  // Handle app visibility changes to re-check permissions (iOS fix)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isOpen && mode === 'camera') {

        // Re-check permissions when app becomes visible
        const hasPermissionNow = await checkPermission()

        if (hasPermissionNow && !cameraReady && !cameraLoading) {
          setTimeout(() => {
            initCamera()
          }, 500) // Small delay to ensure app is fully active
        }
      }
    }

    const handleFocus = async () => {
      if (isOpen && mode === 'camera') {

        // Re-check permissions when window gets focus
        const hasPermissionNow = await checkPermission()

        if (hasPermissionNow && !cameraReady && !cameraLoading) {
          setTimeout(() => {
            initCamera()
          }, 500)
        }
      }
    }

    // Periodic permission check for iOS (every 2 seconds when camera is not ready)
    let permissionCheckInterval: NodeJS.Timeout | null = null

    if (isOpen && mode === 'camera' && !cameraReady && !cameraLoading && hasPermission === false) {
      permissionCheckInterval = setInterval(async () => {
        const hasPermissionNow = await checkPermission()

        if (hasPermissionNow && !cameraReady && !cameraLoading) {
          setTimeout(() => {
            initCamera()
          }, 500)

          if (permissionCheckInterval) {
            clearInterval(permissionCheckInterval)
            permissionCheckInterval = null
          }
        }
      }, 2000) // Check every 2 seconds
    }

    // Add event listeners for visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)

      if (permissionCheckInterval) {
        clearInterval(permissionCheckInterval)
      }
    }
  }, [isOpen, mode, cameraReady, cameraLoading, hasPermission, checkPermission, initCamera])

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <>
      <style jsx>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 640px) {
          .slider::-webkit-slider-thumb {
            height: 24px;
            width: 24px;
          }
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
          }
        }
        /* iOS Safari fixes */
        .ios-fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-width: none !important;
          max-height: none !important;
          transform: none !important;
          z-index: 9999 !important;
        }
        /* Prevent iOS Safari zoom on input focus */
        input, textarea, select {
          font-size: 16px !important;
        }
        /* Fix iOS Safari viewport issues */
        @supports (-webkit-touch-callout: none) {
          .ios-fullscreen {
            height: -webkit-fill-available !important;
          }
        }
      `}</style>
      <FullscreenDialog isOpen={isOpen} onClose={handleClose}>

        {mode === 'upload' && (
          // Upload Mode
          <div className="relative w-full h-full bg-black ios-fullscreen flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white hover:bg-white/10 rounded-full p-3"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-center max-w-md">
              <Upload className="w-16 h-16 text-white/70 mx-auto mb-6" />
              <h2 className="text-white text-2xl font-bold mb-4">Upload Video</h2>
              <p className="text-white/70 text-base mb-8">
                Select a video file from your device to share
              </p>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-4 text-lg font-medium w-full mb-4"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose Video File
              </Button>

              <Button
                onClick={() => setMode('camera')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-3 w-full"
              >
                Try Camera Instead
              </Button>
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

        {mode === 'camera' && (
          // TikTok-style Camera Interface
          <div
            className="relative w-full h-full bg-black overflow-hidden ios-fullscreen"
            onClick={closeAllSelectors}
          >
            {/* Camera Preview */}
            <video
              ref={videoRef}
              className={cn(
                "w-full h-full object-contain bg-black",
                isRecording && "ring-4 ring-red-500 ring-inset"
              )}
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                filter: getFilterClass()
              }}
              muted
              playsInline
              autoPlay
            />


            {/* Recording Overlay */}
            {isRecording && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-red-500 animate-pulse" />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  REC
                </div>
              </div>
            )}

            {/* Camera Loading/Permission Overlay */}
            {(cameraLoading || permissionLoading || !cameraReady) && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20 p-4">
                {(cameraLoading || permissionLoading) ? (
                  <>
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <p className="text-white text-lg mb-2 text-center">
                      {permissionLoading ? 'Requesting permissions...' : 'Starting camera...'}
                    </p>
                    <p className="text-white/70 text-sm text-center px-4">
                      {permissionLoading
                        ? 'Please allow camera and microphone access when prompted'
                        : 'Setting up your camera for recording'
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="w-16 h-16 text-white/50 mb-4" />
                    <p className="text-white text-lg mb-2 text-center">Camera not ready</p>
                    <p className="text-white/70 text-sm text-center px-4 mb-4">
                      {hasPermission === false
                        ? 'Camera permission required. If you just granted permission, tap "Retry Camera" below.'
                        : 'Please check camera permissions and try again'
                      }
                    </p>
                    {hasPermission === false && (
                      <p className="text-white/50 text-xs text-center px-4 mb-4">
                        On iOS: Settings → MirroSocial → Camera → Allow
                      </p>
                    )}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <Button
                        onClick={initCamera}
                        className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 font-medium w-full"
                      >
                        {hasPermission === false ? 'Retry Camera' : 'Retry Camera'}
                      </Button>
                      <Button
                        onClick={() => setMode('upload')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 rounded-full px-6 py-3 w-full"
                      >
                        Upload Video Instead
                      </Button>
                      {hasPermission === false && (
                        <Button
                          onClick={() => {
                            toast({
                              title: "Camera Settings",
                              description: "Go to Settings → MirroSocial → Camera and enable camera access, then return to the app.",
                              duration: 8000,
                            })
                          }}
                          variant="ghost"
                          className="text-white/70 hover:bg-white/5 rounded-full px-6 py-2 text-sm w-full"
                        >
                          Settings Help
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}



            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white hover:bg-white/10 rounded-full p-3 min-w-[48px] min-h-[48px]"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Recording Timer */}
            {isRecording && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-red-500 text-white px-4 py-2 rounded-full text-base font-bold flex items-center gap-2 shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {/* Debug State Display - Remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs max-w-[200px]">
                <div>Recording: {isRecording ? 'YES' : 'NO'}</div>
                <div>Stopping: {isStoppingRecording ? 'YES' : 'NO'}</div>
                <div>Time: {recordingTime}s</div>
                <div>Camera Ready: {cameraReady ? 'YES' : 'NO'}</div>
                <div>Camera Loading: {cameraLoading ? 'YES' : 'NO'}</div>
                <div>Permission Loading: {permissionLoading ? 'YES' : 'NO'}</div>
                <div>Has Permission: {hasPermission === null ? 'UNKNOWN' : hasPermission ? 'YES' : 'NO'}</div>
                <div>Mode: {mode}</div>
                <div>Platform: {typeof window !== 'undefined' ? window.navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other' : 'SSR'}</div>
              </div>
            )}

            {/* Right Side Controls */}
            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-4 sm:gap-6">

              {/* Add Sound */}
              <button
                onClick={() => {
                  toast({
                    title: "Add Sound",
                    description: "Sound selection coming soon!",
                  })
                }}
                className="flex flex-col items-center text-white touch-manipulation"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/30 rounded-full flex items-center justify-center mb-1 hover:bg-black/50 transition-colors active:scale-95">
                  <Music className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-medium">Sound</span>
              </button>

              {/* Flip Camera */}
              <button
                onClick={flipCamera}
                disabled={isRecording}
                className="flex flex-col items-center text-white disabled:opacity-50 touch-manipulation"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/30 rounded-full flex items-center justify-center mb-1 hover:bg-black/50 transition-colors active:scale-95">
                  <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-medium">Flip</span>
              </button>

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpeedSelector(!showSpeedSelector)
                  }}
                  className="flex flex-col items-center text-white touch-manipulation"
                >
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 transition-colors active:scale-95",
                    speedMode !== '1x' ? "bg-blue-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs font-medium">{speedMode}</span>
                </button>

                {showSpeedSelector && (
                  <div
                    className="absolute right-16 sm:right-18 top-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[80px] border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(['0.5x', '1x', '2x', '3x'] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "block w-full text-left px-3 py-3 text-sm rounded hover:bg-white/10 transition-colors touch-manipulation",
                          speedMode === speed ? "text-blue-400 bg-blue-500/20" : "text-white"
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
                  className="flex flex-col items-center text-white touch-manipulation"
                >
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 transition-colors active:scale-95",
                    filterMode !== 'none' ? "bg-purple-500" : "bg-black/30 hover:bg-black/50"
                  )}>
                    <Filter className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs font-medium">Filters</span>
                </button>

                {showFilterSelector && (
                  <div
                    className="absolute right-16 sm:right-18 top-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[100px] border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(['none', 'vintage', 'dramatic', 'bright', 'warm'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={cn(
                          "block w-full text-left px-3 py-3 text-sm rounded hover:bg-white/10 transition-colors capitalize touch-manipulation",
                          filterMode === filter ? "text-purple-400 bg-purple-500/20" : "text-white"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>



              {/* Flash */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="flex flex-col items-center text-white touch-manipulation"
              >
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 transition-colors active:scale-95",
                  flashEnabled ? "bg-yellow-500" : "bg-black/30 hover:bg-black/50"
                )}>
                  <Flash className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-medium">Flash</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 sm:pb-8 safe-area-bottom">
              {/* Duration Selector */}
              <div className="flex justify-center mb-4 sm:mb-6 px-4">
                <div className="flex bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/10">
                  {(['3m', '60s', '30s', '15s'] as const).map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={cn(
                        "px-4 py-2 sm:px-5 sm:py-3 rounded-full text-sm font-medium transition-all touch-manipulation min-w-[60px]",
                        selectedDuration === duration
                          ? "bg-white text-black shadow-lg"
                          : "text-white hover:bg-white/10 active:bg-white/20"
                      )}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 px-4">

                {/* Record Button */}
                <div className="relative">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!cameraReady}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation"
                    >
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      disabled={isStoppingRecording}
                      className={cn(
                        "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-lg touch-manipulation border-4 border-red-500",
                        isStoppingRecording
                          ? "bg-red-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 active:scale-90"
                      )}
                      style={{ minWidth: '80px', minHeight: '80px' }}
                    >
                      {isStoppingRecording ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Square className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                      )}
                    </button>
                  )}

                  {/* Progress Ring */}
                  {isRecording && (
                    <div className="absolute inset-0 -rotate-90">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24">
                        <circle
                          cx="40"
                          cy="40"
                          r="38"
                          stroke="white"
                          strokeWidth="3"
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
                  className="flex flex-col items-center text-white touch-manipulation"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-1 hover:bg-black/60 transition-colors active:scale-95 border border-white/10">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs font-medium">Upload</span>
                </button>
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
          <div className="relative w-full h-full bg-black ios-fullscreen">
            {/* Video Preview */}
            <video
              src={previewUrl || undefined}
              className="w-full h-full object-contain bg-black"
              controls={false}
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top">
              <Button
                variant="ghost"
                onClick={() => {
                  setMode('camera')
                  removeFile()
                }}
                className="text-white hover:bg-white/10 rounded-full p-3 min-w-[48px] min-h-[48px]"
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                onClick={() => setShowCaption(!showCaption)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 min-h-[40px] text-sm font-medium shadow-lg touch-manipulation"
              >
                Next
              </Button>
            </div>

            {/* Caption Overlay */}
            {showCaption && (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6 safe-area-bottom">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your video..."
                  className="w-full bg-black/40 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base sm:text-lg rounded-lg p-3 sm:p-4"
                  maxLength={2000}
                  rows={3}
                />

                <div className="flex items-center justify-between mt-4 gap-4">
                  <span className="text-white/60 text-sm font-medium">{caption.length}/2000</span>

                  <Button
                    onClick={handleCreatePost}
                    disabled={isUploading || !caption.trim()}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-full px-6 sm:px-8 py-2 sm:py-3 font-medium shadow-lg touch-manipulation min-w-[100px] transition-all"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Posting...</span>
                        <span className="sm:hidden">...</span>
                      </div>
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Tap to add caption hint */}
            {!showCaption && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                <button
                  onClick={() => setShowCaption(true)}
                  className="bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/20 hover:bg-black/60 transition-colors touch-manipulation"
                >
                  Tap to add caption
                </button>
              </div>
            )}
          </div>
        )}
      </FullscreenDialog>
    </>
  )
}
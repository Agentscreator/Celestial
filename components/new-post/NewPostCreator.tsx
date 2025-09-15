"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Upload,
  X,
  Loader2,
  Camera,
  Square,
  RotateCw,
  Music,
  Zap,
  Filter,
  Sparkles,
  Timer,
  Slash as Flash,
  Volume2,
  VolumeX,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"

interface NewPostCreatorProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: (post: any) => void
}

export function NewPostCreator({ isOpen, onClose, onPostCreated }: NewPostCreatorProps) {
  const [mode, setMode] = useState<"camera" | "upload" | "preview">("camera")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState<"15s" | "60s" | "3m">("15s")
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  const [speedMode, setSpeedMode] = useState<"0.5x" | "1x" | "2x" | "3x">("1x")
  const [filterMode, setFilterMode] = useState<"none" | "vintage" | "dramatic" | "bright" | "warm">("none")
  const [beautyMode, setBeautyMode] = useState(0) // 0-100
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerDuration, setTimerDuration] = useState<3 | 10>(3)
  const [showSpeedSelector, setShowSpeedSelector] = useState(false)
  const [showFilterSelector, setShowFilterSelector] = useState(false)
  const [showBeautySlider, setShowBeautySlider] = useState(false)
  const [showTimerSelector, setShowTimerSelector] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)

  // Hooks and refs
  const { hasPermission, isLoading: permissionLoading, getCameraStreamWithPermission } = useCameraPermissions()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera with native permissions
  const initCamera = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (cameraLoading || permissionLoading) {
      console.log("Camera initialization already in progress, skipping...")
      return
    }

    console.log("Starting camera initialization...")
    setCameraLoading(true)
    setCameraReady(false)

    // Stop any existing stream first
    if (streamRef.current) {
      console.log("Stopping existing camera stream...")
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    try {
      console.log("Requesting native camera permissions and stream...")

      // Use the hook to get camera stream with native permissions
      const stream = await getCameraStreamWithPermission({
        facingMode: facingMode,
        audioEnabled: audioEnabled,
      })

      if (!stream) {
        throw new Error("Failed to get camera stream - permission may have been denied")
      }

      console.log("Camera stream obtained successfully:", stream)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, attempting to play...")
          videoRef.current
            ?.play()
            .then(() => {
              console.log("Video playing successfully")
              setCameraReady(true)
              setCameraLoading(false)
            })
            .catch((err) => {
              console.error("Error playing video:", err)
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
          console.error("Video element error:", err)
          setCameraLoading(false)
          setCameraReady(false)
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
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
      streamRef.current.getTracks().forEach((track) => track.stop())
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
      if (!file.type.startsWith("video/")) {
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
      setMode("preview")
    }
  }

  // Get max recording duration in seconds
  const getMaxDuration = () => {
    switch (selectedDuration) {
      case "15s":
        return 15
      case "60s":
        return 60
      case "3m":
        return 180
      default:
        return 15
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
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
        setSelectedFile(new File([blob], "recorded-video.webm", { type: "video/webm" }))
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setMode("preview")
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Recording timer with auto-stop at max duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          if (newTime >= getMaxDuration()) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
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
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [])

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle speed mode change
  const handleSpeedChange = (speed: "0.5x" | "1x" | "2x" | "3x") => {
    setSpeedMode(speed)
    setShowSpeedSelector(false)
    toast({
      title: "Speed changed",
      description: `Recording speed set to ${speed}`,
    })
  }

  // Handle filter change
  const handleFilterChange = (filter: "none" | "vintage" | "dramatic" | "bright" | "warm") => {
    setFilterMode(filter)
    setShowFilterSelector(false)
    toast({
      title: "Filter applied",
      description: filter === "none" ? "Filter removed" : `${filter} filter applied`,
    })
  }

  // Handle beauty mode change
  const handleBeautyChange = (value: number) => {
    setBeautyMode(value)
    toast({
      title: "Beauty mode",
      description: value === 0 ? "Beauty mode disabled" : `Beauty level: ${value}%`,
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
      case "vintage":
        return "sepia(0.8) contrast(1.2)"
      case "dramatic":
        return "contrast(1.5) saturate(1.3)"
      case "bright":
        return "brightness(1.2) saturate(1.1)"
      case "warm":
        return "sepia(0.3) saturate(1.2) hue-rotate(10deg)"
      default:
        return "none"
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
      formData.append("content", caption.trim())
      formData.append("media", selectedFile)
      formData.append("isInvite", "false")

      const response = await fetch("/api/posts", {
        method: "POST",
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
        window.dispatchEvent(new CustomEvent("postCreated"))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
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
    setMode("camera")
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
    if (isOpen && mode === "camera") {
      initCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, mode]) // Removed function dependencies to prevent infinite loop

  // Re-initialize camera when settings change (but not on first load)
  useEffect(() => {
    if (cameraReady && mode === "camera") {
      stopCamera()
      setTimeout(() => {
        initCamera()
      }, 100)
    }
  }, [facingMode, audioEnabled]) // Only depend on the actual settings, not the functions

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 bg-black border-none rounded-none [&>button]:hidden overflow-hidden"
        style={{
          // iOS safe area support
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          // Prevent iOS bounce scrolling
          overscrollBehavior: "none",
          // Ensure full viewport height on mobile
          height: "100dvh",
          minHeight: "100dvh",
        }}
        hideTitle={true}
        title="Create New Post"
        description="Create and share a new video post"
      >
        {mode === "camera" && (
          // TikTok-style Camera Interface
          <div
            className="relative w-full h-full bg-black overflow-hidden touch-none"
            onClick={closeAllSelectors}
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "none",
              touchAction: "manipulation",
            }}
          >
            {/* Camera Preview */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                filter: getFilterClass(),
              }}
              muted
              playsInline
              autoPlay
            />

            {/* Camera Loading/Permission Overlay */}
            {(cameraLoading || permissionLoading || !cameraReady) && (
              <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black flex flex-col items-center justify-center z-20 p-8">
                {cameraLoading || permissionLoading ? (
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-white text-xl font-semibold">
                        {permissionLoading ? "Requesting Permissions" : "Starting Camera"}
                      </h3>
                      <p className="text-white/70 text-base text-center max-w-sm leading-relaxed">
                        {permissionLoading
                          ? "Please allow camera and microphone access when prompted to continue"
                          : "Setting up your camera for the best recording experience"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                      <Camera className="w-10 h-10 text-white/60" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-white text-xl font-semibold">Camera Not Ready</h3>
                      <p className="text-white/70 text-base text-center max-w-sm leading-relaxed">
                        {hasPermission === false
                          ? "Camera permission is required to record videos. Please allow access in your device settings."
                          : "Unable to access camera. Please check your permissions and try again."}
                      </p>
                    </div>
                    <Button
                      onClick={initCamera}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full px-8 py-3 text-base font-semibold min-h-[48px] shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {hasPermission === false ? "Grant Permission" : "Try Again"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Top Bar */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
            >
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white hover:bg-white/10 rounded-full p-3 min-h-[48px] min-w-[48px]"
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                className="bg-black/30 text-white hover:bg-black/50 rounded-full px-6 py-3 text-sm font-medium min-h-[48px]"
              >
                <Music className="h-4 w-4 mr-2" />
                Add sound
              </Button>
              <div className="w-12" /> {/* Spacer for balance */}
            </div>

            {/* Recording Timer */}
            {isRecording && (
              <div
                className="absolute left-1/2 transform -translate-x-1/2 z-10"
                style={{ top: "max(4rem, calc(env(safe-area-inset-top) + 2rem))" }}
              >
                <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  ● {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {/* Right Side Controls */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-6">
              {/* Flip Camera */}
              <div className="flex flex-col items-center">
                <button
                  onClick={flipCamera}
                  disabled={isRecording}
                  className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all duration-200 border border-white/20 disabled:opacity-50 active:scale-95"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </button>
                <span className="text-xs font-medium text-white mt-2">Flip</span>
              </div>

              {/* Audio Toggle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  disabled={isRecording}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 disabled:opacity-50 active:scale-95",
                    audioEnabled ? "bg-green-500/90" : "bg-black/40 hover:bg-black/60"
                  )}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-6 h-6 text-white" />
                  ) : (
                    <VolumeX className="w-6 h-6 text-white" />
                  )}
                </button>
                <span className="text-xs font-medium text-white mt-2">Audio</span>
              </div>

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpeedSelector(!showSpeedSelector)
                  }}
                  className="flex flex-col items-center text-white active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors backdrop-blur-sm border border-white/20",
                      speedMode !== "1x" ? "bg-blue-500/90" : "bg-black/40 hover:bg-black/60",
                    )}
                  >
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">{speedMode}</span>
                </button>

                {showSpeedSelector && (
                  <div
                    className="absolute right-16 top-0 bg-black/90 backdrop-blur-md rounded-2xl p-3 min-w-[90px] border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["0.5x", "1x", "2x", "3x"] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "block w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-colors font-medium min-h-[44px]",
                          speedMode === speed ? "text-blue-400 bg-blue-500/20" : "text-white",
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
                  className="flex flex-col items-center text-white active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors backdrop-blur-sm border border-white/20",
                      filterMode !== "none" ? "bg-purple-500/90" : "bg-black/40 hover:bg-black/60",
                    )}
                  >
                    <Filter className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">Filters</span>
                </button>

                {showFilterSelector && (
                  <div
                    className="absolute right-16 top-0 bg-black/90 backdrop-blur-md rounded-2xl p-3 min-w-[110px] border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["none", "vintage", "dramatic", "bright", "warm"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleFilterChange(filter)}
                        className={cn(
                          "block w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-colors capitalize font-medium min-h-[44px]",
                          filterMode === filter ? "text-purple-400 bg-purple-500/20" : "text-white",
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
                  className="flex flex-col items-center text-white active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors backdrop-blur-sm border border-white/20",
                      beautyMode > 0 ? "bg-pink-500/90" : "bg-black/40 hover:bg-black/60",
                    )}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">Beauty</span>
                </button>

                {showBeautySlider && (
                  <div
                    className="absolute right-16 top-0 bg-black/90 backdrop-blur-md rounded-2xl p-4 w-48 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-white text-sm mb-3 font-medium">Beauty: {beautyMode}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={beautyMode}
                      onChange={(e) => handleBeautyChange(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer slider accent-pink-500"
                      style={{
                        background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${beautyMode}%, #374151 ${beautyMode}%, #374151 100%)`,
                      }}
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
                  className="flex flex-col items-center text-white active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors backdrop-blur-sm border border-white/20",
                      timerEnabled ? "bg-green-500/90" : "bg-black/40 hover:bg-black/60",
                    )}
                  >
                    <Timer className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">Timer</span>
                </button>

                {showTimerSelector && (
                  <div
                    className="absolute right-16 top-0 bg-black/90 backdrop-blur-md rounded-2xl p-3 min-w-[90px] border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setTimerDuration(3)}
                      className={cn(
                        "block w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-colors font-medium min-h-[44px]",
                        timerDuration === 3 ? "text-green-400 bg-green-500/20" : "text-white",
                      )}
                    >
                      3s
                    </button>
                    <button
                      onClick={() => setTimerDuration(10)}
                      className={cn(
                        "block w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-colors font-medium min-h-[44px]",
                        timerDuration === 10 ? "text-green-400 bg-green-500/20" : "text-white",
                      )}
                    >
                      10s
                    </button>
                    <button
                      onClick={handleTimerToggle}
                      className="block w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-colors text-green-400 border-t border-white/20 mt-2 pt-3 font-medium min-h-[44px]"
                    >
                      {timerEnabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                )}
              </div>

              {/* Flash */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="flex flex-col items-center text-white active:scale-95 transition-transform"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors backdrop-blur-sm border border-white/20",
                    flashEnabled ? "bg-yellow-500/90" : "bg-black/40 hover:bg-black/60",
                  )}
                >
                  <Flash className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Flash</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
            >
              {/* Duration Selector */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-black/50 backdrop-blur-md rounded-full p-1.5 border border-white/30 shadow-xl">
                  {(["15s", "60s", "3m"] as const).map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={cn(
                        "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 min-h-[40px] min-w-[55px]",
                        selectedDuration === duration
                          ? "bg-white text-black shadow-lg transform scale-105"
                          : "text-white hover:bg-white/15 active:scale-95",
                      )}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-end justify-center gap-8 px-6">
                {/* Effects */}
                <div className="flex flex-col items-center">
                  <button className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 hover:bg-black/60 transition-all duration-200 active:scale-95">
                    <Sparkles className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-xs font-medium text-white mt-2">Effects</span>
                </div>

                {/* Record Button */}
                <div className="relative flex flex-col items-center">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!cameraReady}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl border-4 border-white/20"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500 rounded-full" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-2xl border-4 border-white/20"
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
                          strokeDasharray={`${(recordingTime / getMaxDuration()) * 239} 239`}
                          className="transition-all duration-1000 drop-shadow-lg"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Recording Status */}
                  {!isRecording && cameraReady && (
                    <span className="text-xs font-medium text-white mt-2">Hold to record</span>
                  )}
                </div>

                {/* Upload */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 hover:bg-black/60 transition-all duration-200 active:scale-95"
                  >
                    <Upload className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-xs font-medium text-white mt-2">Upload</span>
                </div>
              </div>

              {/* Bottom Tab Bar */}
              <div className="flex justify-center mt-6">
                <div className="flex bg-black/50 backdrop-blur-md rounded-full px-6 py-2.5 border border-white/30 shadow-lg">
                  <button className="text-white font-semibold px-4 py-1 text-base">
                    Camera
                  </button>
                  <div className="w-px bg-white/20 mx-3"></div>
                  <button className="text-white/60 hover:text-white/80 transition-colors px-4 py-1 text-base">
                    Templates
                  </button>
                </div>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        {mode === "preview" && (
          // Preview Mode with Caption
          <div
            className="relative w-full h-full bg-black"
            style={{
              overscrollBehavior: "none",
              touchAction: "manipulation",
            }}
          >
            {/* Video Preview */}
            <video
              src={previewUrl || undefined}
              className="w-full h-full object-cover"
              controls={false}
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Top Bar */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("camera")
                  removeFile()
                }}
                className="text-white hover:bg-white/10 rounded-full p-3 min-h-[48px] min-w-[48px]"
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                className="bg-black/30 text-white hover:bg-black/50 rounded-full px-6 py-3 text-sm font-medium min-h-[48px] backdrop-blur-sm"
              >
                <Music className="h-4 w-4 mr-2" />
                Add sound
              </Button>

              <Button
                onClick={() => setShowCaption(!showCaption)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-medium min-h-[48px] shadow-lg"
              >
                Next
              </Button>
            </div>

            {/* Caption Overlay */}
            {showCaption && (
              <div
                className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/90 to-transparent p-6"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
              >
                <div className="space-y-4">
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe your video... What's happening?"
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base rounded-2xl p-4 min-h-[100px] transition-all duration-200"
                    maxLength={2000}
                    rows={3}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-white/60 text-sm font-medium">
                        {caption.length}/2000
                      </span>
                      {caption.length > 1800 && (
                        <span className="text-yellow-400 text-xs">
                          {2000 - caption.length} characters left
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={handleCreatePost}
                      disabled={isUploading || !caption.trim()}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-full px-8 py-3 font-bold text-base min-h-[48px] shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Posting...</span>
                        </div>
                      ) : (
                        "Share"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Play, 
  Pause, 
  Music, 
  X, 
  Loader2, 
  Volume2,
  VolumeX,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SpotifyTrack, formatDuration, getTrackDisplayName } from "@/utils/spotify"

interface SoundSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectSound: (track: SpotifyTrack | null) => void
  selectedSound: SpotifyTrack | null
}

export function SoundSelector({ 
  isOpen, 
  onClose, 
  onSelectSound, 
  selectedSound 
}: SoundSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [showPopular, setShowPopular] = useState(true)
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load popular tracks on open
  useEffect(() => {
    if (isOpen && showPopular) {
      loadPopularTracks()
    }
  }, [isOpen, showPopular])

  // Search tracks when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      setShowPopular(false)
      searchTimeoutRef.current = setTimeout(() => {
        searchTracks(searchQuery.trim())
      }, 500)
    } else {
      setShowPopular(true)
      if (isOpen) {
        loadPopularTracks()
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, isOpen])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const loadPopularTracks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/spotify/search?popular=true')
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks || [])
      }
    } catch (error) {
      console.error('Error loading popular tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchTracks = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks || [])
      }
    } catch (error) {
      console.error('Error searching tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) return

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingTrack === track.id) {
      setPlayingTrack(null)
      return
    }

    // Create new audio element
    const audio = new Audio(track.preview_url)
    audio.volume = muted ? 0 : volume
    audioRef.current = audio

    audio.onended = () => {
      setPlayingTrack(null)
      audioRef.current = null
    }

    audio.onerror = () => {
      setPlayingTrack(null)
      audioRef.current = null
    }

    audio.play().then(() => {
      setPlayingTrack(track.id)
    }).catch((error) => {
      console.error('Error playing audio:', error)
      setPlayingTrack(null)
      audioRef.current = null
    })
  }

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingTrack(null)
  }

  const handleSelectTrack = (track: SpotifyTrack) => {
    stopPreview()
    onSelectSound(track)
    onClose()
  }

  const handleRemoveSound = () => {
    stopPreview()
    onSelectSound(null)
    onClose()
  }

  const handleClose = () => {
    stopPreview()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[80vh] sm:h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Add Sound</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="rounded-full p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for sounds..."
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMuted(!muted)}
              className="p-1"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={muted ? 0 : volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value)
                setVolume(newVolume)
                if (newVolume > 0) setMuted(false)
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Current Selection */}
        {selectedSound && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                  Currently selected:
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {getTrackDisplayName(selectedSound)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveSound}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            {showPopular ? (
              <>
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Popular Sounds
                </span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Results
                </span>
              </>
            )}
          </div>
        </div>

        {/* Track List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {showPopular ? 'No popular tracks available' : 'No tracks found'}
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedSound?.id === track.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => handleSelectTrack(track)}
                >
                  {/* Album Art */}
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                    {track.album.images[0] ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {track.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDuration(track.duration_ms)}
                    </p>
                  </div>

                  {/* Play Button */}
                  {track.preview_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        playPreview(track)
                      }}
                      className="p-2 rounded-full"
                    >
                      {playingTrack === track.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
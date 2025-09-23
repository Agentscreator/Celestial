"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LocationInput } from "@/components/ui/location-input"
import { RepeatingEventConfig } from "@/components/events/RepeatingEventConfig"
import { Calendar, MapPin, Clock, Users, Repeat, MessageCircle, ArrowLeft, ArrowRight, Save, X, Upload, Image, Video } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AdvancedSettings {
  isRepeating: boolean
  repeatPattern: string
  repeatInterval: number
  repeatEndDate?: string
  repeatDaysOfWeek?: string
  enableCommunity: boolean
  communityName: string
  invitationMessage: string
}

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [prefilledMedia, setPrefilledMedia] = useState<any>(null)

  const [formData, setFormData] = useState({
    description: "",
    date: "",
    time: "",
    location: "",
    maxAttendees: "",
    isPublic: true
  })

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    isRepeating: false,
    repeatPattern: "weekly",
    repeatInterval: 1,
    repeatEndDate: undefined,
    repeatDaysOfWeek: undefined,
    enableCommunity: false,
    communityName: "",
    invitationMessage: ""
  })

  // Load prefilled data from post creator
  useEffect(() => {
    const pendingData = localStorage.getItem('pendingEventData')
    if (pendingData) {
      try {
        const eventData = JSON.parse(pendingData)
        console.log('Loading prefilled event data:', eventData)
        
        // Set description from post
        if (eventData.description) {
          setFormData(prev => ({ ...prev, description: eventData.description }))
        }
        
        // Set media if available
        if (eventData.media) {
          setPrefilledMedia(eventData.media)
        }
        
        // Clear the stored data
        localStorage.removeItem('pendingEventData')
      } catch (error) {
        console.error('Error loading prefilled data:', error)
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAdvancedSettingChange = useCallback((field: keyof AdvancedSettings, value: string | boolean | number | undefined) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Memoized callbacks for RepeatingEventConfig
  const handleRepeatingChange = useCallback((checked: boolean) => handleAdvancedSettingChange("isRepeating", checked), [handleAdvancedSettingChange])
  const handleRepeatPatternChange = useCallback((pattern: string) => handleAdvancedSettingChange("repeatPattern", pattern), [handleAdvancedSettingChange])
  const handleRepeatIntervalChange = useCallback((interval: number) => handleAdvancedSettingChange("repeatInterval", interval), [handleAdvancedSettingChange])
  const handleRepeatEndDateChange = useCallback((date?: string) => handleAdvancedSettingChange("repeatEndDate", date), [handleAdvancedSettingChange])
  const handleRepeatDaysOfWeekChange = useCallback((days?: string) => handleAdvancedSettingChange("repeatDaysOfWeek", days), [handleAdvancedSettingChange])

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Convert prefilled media file back to File object if needed
      let mediaFile = null
      if (prefilledMedia?.fileData) {
        // Convert base64 back to File
        const response = await fetch(prefilledMedia.fileData)
        const blob = await response.blob()
        mediaFile = new File([blob], prefilledMedia.fileName, { type: prefilledMedia.fileType })
      }

      const eventData = {
        title: `Event - ${new Date().toLocaleDateString()}`, // Auto-generate title
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        maxAttendees: formData.maxAttendees,
        isPublic: formData.isPublic,
        themeId: null, // No theme selection
        customBackgroundUrl: null,
        customBackgroundType: null,
        inviteVideoUrl: null,
        inviteVideoThumbnail: null,
        inviteVideoDescription: null,
        ...advancedSettings,
        // Ensure repeat settings are properly formatted
        repeatPattern: advancedSettings.isRepeating ? advancedSettings.repeatPattern : null,
        repeatInterval: advancedSettings.isRepeating ? advancedSettings.repeatInterval : null,
        repeatEndDate: advancedSettings.isRepeating ? advancedSettings.repeatEndDate : null,
        repeatDaysOfWeek: advancedSettings.isRepeating ? advancedSettings.repeatDaysOfWeek : null,
        isDraft: saveAsDraft
      }

      // Create FormData for file upload
      const formDataToSend = new FormData()
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString())
        }
      })

      if (mediaFile) {
        formDataToSend.append('media', mediaFile)
      }

      const response = await fetch("/api/events", {
        method: "POST",
        body: formDataToSend
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Event creation response:', result)

        if (saveAsDraft) {
          toast({
            title: "Draft Saved",
            description: "Your event has been saved as a draft.",
          })
        } else {
          toast({
            title: "Event Created",
            description: "Your event has been created successfully!",
          })
          if (result.event?.id) {
            router.push(`/events/${result.event.id}`)
          } else {
            router.push('/events')
          }
        }
      } else {
        const error = await response.json()
        console.error("Error creating event:", error)
        toast({
          title: "Error",
          description: error.error || "Failed to create event. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToStep2 = () => {
    return formData.description && formData.date && formData.time && formData.location
  }

  return (
    <>
      <div className="dark font-sans text-white antialiased" style={{
        background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1d 100%)',
        minHeight: '100vh',
        WebkitTapHighlightColor: 'transparent'
      }}>
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-blue-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4 sm:mb-6 shadow-lg">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Create New Event
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-4">
              Share your moment and bring people together
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 1
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                : 'bg-white/10 border-white/20'
                }`}>
                <span className="text-xs sm:text-sm font-semibold">1</span>
              </div>
              <div className={`w-8 sm:w-12 h-0.5 transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-600'}`}></div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 2
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                : 'bg-white/10 border-white/20'
                }`}>
                <span className="text-xs sm:text-sm font-semibold">2</span>
              </div>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Step 1: Media and Basic Details */}
            {currentStep === 1 && (
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
                  <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3 sm:mr-4"></span>
                  Event Details
                </h2>

                {/* Media Preview */}
                {prefilledMedia && (
                  <div className="mb-4 sm:mb-6">
                    <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Event Media</Label>
                    <div className="relative bg-gray-800/40 rounded-lg sm:rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      {prefilledMedia.fileType?.startsWith('video/') ? (
                        <video
                          src={prefilledMedia.previewUrl || prefilledMedia.fileData}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={prefilledMedia.previewUrl || prefilledMedia.fileData}
                          alt="Event media"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-3 py-1">
                        <span className="text-xs sm:text-sm text-white flex items-center gap-1 sm:gap-2">
                          {prefilledMedia.fileType?.startsWith('video/') ? <Video className="w-3 h-3 sm:w-4 sm:h-4" /> : <Image className="w-3 h-3 sm:w-4 sm:h-4" />}
                          <span className="hidden sm:inline">{prefilledMedia.fileName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {/* Description */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Description *</Label>
                    <Textarea
                      rows={3}
                      placeholder="Tell us about your event..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-lg sm:rounded-xl resize-none"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-lg sm:rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Time *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-lg sm:rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Location *</Label>
                    <LocationInput
                      value={formData.location}
                      onChange={(value) => handleInputChange("location", value)}
                      placeholder="Where is your event?"
                      required
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-lg sm:rounded-xl"
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-3 sm:px-4 py-2 text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToStep2()}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Next Step</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Optional Advanced Settings */}
            {currentStep === 2 && (
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
                  <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 sm:mr-4"></span>
                  Optional Settings
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  {/* Max Attendees */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Max Attendees</Label>
                    <Input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={formData.maxAttendees}
                      onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-lg sm:rounded-xl"
                    />
                  </div>

                  {/* Community Toggle */}
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/40 rounded-lg sm:rounded-xl">
                    <div className="flex-1 pr-3">
                      <Label className="text-sm sm:text-base font-medium">Enable Community</Label>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Create a community group for ongoing discussions</p>
                    </div>
                    <Switch
                      checked={advancedSettings.enableCommunity}
                      onCheckedChange={(checked) => handleAdvancedSettingChange("enableCommunity", checked)}
                    />
                  </div>

                  {/* Community Settings */}
                  {advancedSettings.enableCommunity && (
                    <div className="space-y-3 sm:space-y-4 pl-3 sm:pl-4 border-l-2 border-blue-500/30">
                      <div>
                        <Label className="block text-sm font-medium text-gray-300 mb-2">Community Name *</Label>
                        <Input
                          type="text"
                          placeholder="What should we call your community?"
                          value={advancedSettings.communityName}
                          onChange={(e) => handleAdvancedSettingChange("communityName", e.target.value)}
                          className="bg-gray-800/60 border-gray-700 text-white placeholder-gray-400 px-3 py-3 text-base rounded-lg sm:rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Repeating Event */}
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/40 rounded-lg sm:rounded-xl">
                    <div className="flex-1 pr-3">
                      <Label className="text-sm sm:text-base font-medium">Repeating Event</Label>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Make this a recurring event</p>
                    </div>
                    <Switch
                      checked={advancedSettings.isRepeating}
                      onCheckedChange={handleRepeatingChange}
                    />
                  </div>

                  {/* Repeating Event Config */}
                  {advancedSettings.isRepeating && (
                    <div className="pl-3 sm:pl-4 border-l-2 border-blue-500/30">
                      <RepeatingEventConfig
                        isRepeating={advancedSettings.isRepeating}
                        onRepeatingChange={handleRepeatingChange}
                        repeatPattern={advancedSettings.repeatPattern}
                        repeatInterval={advancedSettings.repeatInterval}
                        repeatEndDate={advancedSettings.repeatEndDate}
                        repeatDaysOfWeek={advancedSettings.repeatDaysOfWeek}
                        onRepeatPatternChange={handleRepeatPatternChange}
                        onRepeatIntervalChange={handleRepeatIntervalChange}
                        onRepeatEndDateChange={handleRepeatEndDateChange}
                        onRepeatDaysOfWeekChange={handleRepeatDaysOfWeekChange}
                        eventDate={formData.date}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-3 sm:px-4 py-2 text-sm sm:text-base order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    Previous
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/events')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 px-3 sm:px-4 py-2 text-sm sm:text-base"
                    >
                      Skip for Now
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-6 py-2 text-sm sm:text-base"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="hidden sm:inline">Creating...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Create Event</span>
                          <span className="sm:hidden">Create</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
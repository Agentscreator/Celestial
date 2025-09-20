"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LocationInput } from "@/components/ui/location-input"
import { EventMediaUpload } from "@/components/events/EventMediaUpload"
import { RepeatingEventConfig } from "@/components/events/RepeatingEventConfig"
import { Calendar, MapPin, Clock, Users, Camera, Palette, Repeat, MessageCircle, Upload, Check, ArrowLeft, ArrowRight, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EventTheme {
    id: string
    name: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    category: string
    preview: string
    description: string
}

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
    const [selectedTheme, setSelectedTheme] = useState<string>("")
    const [showThemes, setShowThemes] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [customMedia, setCustomMedia] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        title: "",
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

    const [mediaFiles, setMediaFiles] = useState<File[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [isDraft, setIsDraft] = useState(false)
    const [eventMedia, setEventMedia] = useState<any[]>([])
    const [themes, setThemes] = useState<EventTheme[]>([])
    const [loadingThemes, setLoadingThemes] = useState(false)

    // Load themes from API
    useEffect(() => {
        const loadThemes = async () => {
            setLoadingThemes(true)
            try {
                const response = await fetch('/api/events/themes')
                if (response.ok) {
                    const data = await response.json()
                    setThemes(data.themes || [])
                } else {
                    // Fallback to mock themes if API fails
                    setThemes(mockThemes)
                }
            } catch (error) {
                console.error('Error loading themes:', error)
                setThemes(mockThemes)
            } finally {
                setLoadingThemes(false)
            }
        }
        loadThemes()
    }, [])

    // Mock themes data as fallback
    const mockThemes: EventTheme[] = [
        {
            id: "elegant-corporate",
            name: "Elegant Corporate",
            primaryColor: "#374151",
            secondaryColor: "#6B7280",
            accentColor: "#9CA3AF",
            category: "business",
            preview: "Q4 Strategy Meeting",
            description: "Sophisticated design for executive meetings"
        },
        {
            id: "modern-business",
            name: "Modern Business",
            primaryColor: "#2563EB",
            secondaryColor: "#3B82F6",
            accentColor: "#6366F1",
            category: "business",
            preview: "Product Launch",
            description: "Clean and professional for corporate events"
        },
        {
            id: "minimal-tech",
            name: "Minimal Tech",
            primaryColor: "#475569",
            secondaryColor: "#64748B",
            accentColor: "#94A3B8",
            category: "business",
            preview: "AI Conference 2024",
            description: "Sleek design for technology events"
        },
        {
            id: "neon-glow",
            name: "Neon Glow",
            primaryColor: "#9333EA",
            secondaryColor: "#EC4899",
            accentColor: "#8B5CF6",
            category: "party",
            preview: "New Year's Eve",
            description: "Electric atmosphere for night events"
        },
        {
            id: "vibrant-party",
            name: "Vibrant Party",
            primaryColor: "#F97316",
            secondaryColor: "#EF4444",
            accentColor: "#EC4899",
            category: "party",
            preview: "Birthday Celebration",
            description: "Colorful and energetic for celebrations"
        },
        {
            id: "elegant-wedding",
            name: "Elegant Wedding",
            primaryColor: "#FB7185",
            secondaryColor: "#F9A8D4",
            accentColor: "#FBBF24",
            category: "party",
            preview: "Sarah & John's Wedding",
            description: "Romantic design for special occasions"
        },
        {
            id: "festival-fun",
            name: "Festival Fun",
            primaryColor: "#FBBF24",
            secondaryColor: "#FB923C",
            accentColor: "#EF4444",
            category: "party",
            preview: "Summer Music Festival",
            description: "Vibrant theme for festivals and carnivals"
        },
        {
            id: "friendly-gather",
            name: "Friendly Gather",
            primaryColor: "#10B981",
            secondaryColor: "#059669",
            accentColor: "#34D399",
            category: "community",
            preview: "Neighborhood BBQ",
            description: "Warm and welcoming for social events"
        },
        {
            id: "cozy-meetup",
            name: "Cozy Meetup",
            primaryColor: "#F59E0B",
            secondaryColor: "#D97706",
            accentColor: "#FBBF24",
            category: "community",
            preview: "Book Club Meeting",
            description: "Intimate setting for small gatherings"
        },
        {
            id: "charity-event",
            name: "Charity Event",
            primaryColor: "#14B8A6",
            secondaryColor: "#06B6D4",
            accentColor: "#0EA5E9",
            category: "community",
            preview: "Charity Fundraiser",
            description: "Professional theme for fundraising events"
        }
    ]

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

    const selectTheme = (themeId: string) => {
        setSelectedTheme(themeId)
    }

    const toggleSwitch = (element: HTMLElement) => {
        element.classList.toggle('active')
    }

    const toggleCategoryExpansion = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(category)) {
                newSet.delete(category)
            } else {
                newSet.add(category)
            }
            return newSet
        })
    }

    const toggleCommunityOptions = () => {
        setAdvancedSettings(prev => ({
            ...prev,
            enableCommunity: !prev.enableCommunity
        }))
    }

    const updateCharCount = (textarea: HTMLTextAreaElement, counterId: string) => {
        const counter = document.getElementById(counterId)
        const current = textarea.value.length
        const max = textarea.maxLength
        if (counter) {
            counter.textContent = `${current}/${max}`

            if (current > max * 0.9) {
                counter.classList.add('text-red-400')
            } else {
                counter.classList.remove('text-red-400')
            }
        }
    }

    const handleFileUpload = (input: HTMLInputElement) => {
        const file = input.files?.[0]
        if (file) {
            const uploadArea = input.closest('.upload-zone')
            if (uploadArea) {
                uploadArea.innerHTML = `
                    <div class="flex items-center justify-between p-4 glass rounded-xl">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="font-medium text-white">${file.name}</p>
                                <p class="text-sm text-gray-400">${(file.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                        </div>
                        <button type="button" onclick="clearUpload(this)" class="text-red-400 hover:text-red-300 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                `
            }
        }
    }

    const clearUpload = (button: HTMLButtonElement) => {
        const uploadArea = button.closest('.upload-zone')
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                    </div>
                </div>
                <h3 class="text-xl font-semibold mb-2">Add Event Media</h3>
                <p class="text-gray-400 mb-4">Upload images and videos to showcase your event</p>
                <p class="text-sm text-gray-500">Multiple files supported • Max 50MB per file</p>
                <input type="file" class="hidden" multiple accept="image/*,video/*" onchange="handleFileUpload(this)">
            `
        }
    }

    const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
        e.preventDefault()
        setIsLoading(true)
        setIsDraft(saveAsDraft)

        try {
            const eventData = {
                ...formData,
                themeId: selectedTheme || null,
                customBackgroundUrl: customMedia ? URL.createObjectURL(customMedia) : null,
                customBackgroundType: customMedia?.type.startsWith('video/') ? 'video' : 'image',
                ...advancedSettings,
                // Ensure repeat settings are properly formatted
                repeatPattern: advancedSettings.isRepeating ? advancedSettings.repeatPattern : null,
                repeatInterval: advancedSettings.isRepeating ? advancedSettings.repeatInterval : null,
                repeatEndDate: advancedSettings.isRepeating ? advancedSettings.repeatEndDate : null,
                repeatDaysOfWeek: advancedSettings.isRepeating ? advancedSettings.repeatDaysOfWeek : null,
                isDraft: saveAsDraft
            }

            const response = await fetch("/api/events", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            })

            if (response.ok) {
                const result = await response.json()
                console.log('Event creation response:', result)

                if (saveAsDraft) {
                    toast({
                        title: "Draft Saved",
                        description: "Your event has been saved as a draft.",
                    })
                    // Stay on the page for drafts
                } else {
                    toast({
                        title: "Event Created",
                        description: "Your event has been created successfully!",
                    })
                    // Ensure we have a valid event ID before redirecting
                    if (result.event?.id) {
                        router.push(`/events/${result.event.id}`)
                    } else {
                        console.error('No event ID in response:', result)
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
            setIsDraft(false)
        }
    }

    const getThemesByCategory = (category: string) => {
        return themes.filter(theme => theme.category === category)
    }

    const getCategoryDisplayName = (category: string) => {
        const names = {
            business: "Business & Professional",
            party: "Party & Celebration",
            community: "Community & Social"
        }
        return names[category as keyof typeof names] || category
    }

    const nextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const canProceedToStep2 = () => {
        return formData.title && formData.description && formData.date && formData.time && formData.location
    }

    const canProceedToStep3 = () => {
        return selectedTheme || customMedia
    }

    const handleCustomMediaUpload = (file: File) => {
        setCustomMedia(file)
        setSelectedTheme("") // Clear theme selection if custom media is uploaded
    }

    return (

        <div className="dark font-sans text-white antialiased" style={{
            background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1d 100%)',
            minHeight: '100vh'
        }}>
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-blue-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        Create New Event
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Design unforgettable experiences and bring people together
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 1
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                            : 'bg-white/10 border-white/20'
                            }`}>
                            <span className="text-sm font-semibold">1</span>
                        </div>
                        <div className={`w-12 h-0.5 transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-600'}`}></div>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 2
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                            : 'bg-white/10 border-white/20'
                            }`}>
                            <span className="text-sm font-semibold">2</span>
                        </div>
                        <div className={`w-12 h-0.5 transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-600'}`}></div>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 3
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                            : 'bg-white/10 border-white/20'
                            }`}>
                            <span className="text-sm font-semibold">3</span>
                        </div>
                    </div>
                </div>



                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-4"></span>
                                Event Details
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Event Title */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Label className="block text-sm font-medium text-gray-300 mb-3">Event Title *</Label>
                                        <Input
                                            type="text"
                                            placeholder="What's your event called?"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                            required
                                            className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Label className="block text-sm font-medium text-gray-300 mb-3">Description *</Label>
                                        <Textarea
                                            rows={4}
                                            placeholder="Tell us about your event..."
                                            value={formData.description}
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                            required
                                            className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-300 mb-3">Location *</Label>
                                    <LocationInput
                                        value={formData.location}
                                        onChange={(value) => handleInputChange("location", value)}
                                        placeholder="Where is your event?"
                                        required
                                        className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl"
                                    />
                                </div>

                                {/* Max Participants */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-300 mb-3">Max Participants</Label>
                                    <Input
                                        type="number"
                                        placeholder="Leave empty for unlimited"
                                        value={formData.maxAttendees}
                                        onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                                        className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl"
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-300 mb-3">Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange("date", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl"
                                    />
                                </div>

                                {/* Time */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-300 mb-3">Time *</Label>
                                    <Input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => handleInputChange("time", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <div className="mt-8 pt-6 border-t border-gray-700">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></span>
                                    Advanced Settings
                                </h3>

                                <div className="space-y-6">
                                    {/* Community Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl">
                                        <div>
                                            <Label className="text-base font-medium">Enable Community</Label>
                                            <p className="text-sm text-gray-400">Create a community group for ongoing discussions</p>
                                        </div>
                                        <Switch
                                            checked={advancedSettings.enableCommunity}
                                            onCheckedChange={(checked) => handleAdvancedSettingChange("enableCommunity", checked)}
                                        />
                                    </div>

                                    {/* Community Settings */}
                                    {advancedSettings.enableCommunity && (
                                        <div className="space-y-4 pl-4 border-l-2 border-blue-500/30">
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-300 mb-2">Community Name *</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="What should we call your community?"
                                                    value={advancedSettings.communityName}
                                                    onChange={(e) => handleAdvancedSettingChange("communityName", e.target.value)}
                                                    className="bg-gray-800/60 border-gray-700 text-white placeholder-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-sm font-medium text-gray-300 mb-2">Invitation Message *</Label>
                                                <Textarea
                                                    placeholder="Invite people to join your community..."
                                                    value={advancedSettings.invitationMessage}
                                                    onChange={(e) => handleAdvancedSettingChange("invitationMessage", e.target.value)}
                                                    className="bg-gray-800/60 border-gray-700 text-white placeholder-gray-400"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Repeating Event Configuration */}
                                    <RepeatingEventConfig
                                        isRepeating={advancedSettings.isRepeating}
                                        onRepeatingChange={handleRepeatingChange}
                                        repeatPattern={advancedSettings.repeatPattern}
                                        onRepeatPatternChange={handleRepeatPatternChange}
                                        repeatInterval={advancedSettings.repeatInterval}
                                        onRepeatIntervalChange={handleRepeatIntervalChange}
                                        repeatEndDate={advancedSettings.repeatEndDate}
                                        onRepeatEndDateChange={handleRepeatEndDateChange}
                                        repeatDaysOfWeek={advancedSettings.repeatDaysOfWeek}
                                        onRepeatDaysOfWeekChange={handleRepeatDaysOfWeekChange}
                                        eventDate={formData.date}
                                    />
                                </div>
                            </div>

                            {/* Step 1 Navigation */}
                            <div className="flex justify-between pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => handleSubmit(e, true)}
                                    disabled={isLoading || !formData.title}
                                    className="px-6 py-3 border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    {isDraft ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                            Saving Draft...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save as Draft
                                        </>
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canProceedToStep2()}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    Continue to Style & Theme
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Media & Settings */}
                    {currentStep === 3 && (
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-4"></span>
                                Media & Final Settings
                            </h2>

                            <div className="space-y-8">
                                {/* Event Media Upload */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Event Media</h3>
                                    <p className="text-gray-400 mb-4">Add photos and videos to showcase your event</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {eventMedia.map((media, index) => (
                                            <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                                {media.mediaType === 'video' ? (
                                                    <video
                                                        src={media.mediaUrl}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                ) : (
                                                    <img
                                                        src={media.mediaUrl}
                                                        alt={media.title || 'Event media'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                                    <p className="text-white text-sm font-medium">{media.title || 'Untitled'}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Media Button */}
                                        <EventMediaUpload
                                            eventId="temp" // Will be replaced after event creation
                                            onMediaUploaded={(media) => setEventMedia(prev => [...prev, media])}
                                        >
                                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer">
                                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-400">Add Media</p>
                                            </div>
                                        </EventMediaUpload>
                                    </div>
                                </div>

                                {/* Theme Preview */}
                                {selectedTheme && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Selected Theme</h3>
                                        <div className="p-4 bg-gray-800 rounded-lg">
                                            {(() => {
                                                const theme = themes.find(t => t.id === selectedTheme) || mockThemes.find(t => t.id === selectedTheme)
                                                return theme ? (
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className="w-16 h-16 rounded-lg"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                                                            }}
                                                        ></div>
                                                        <div>
                                                            <h4 className="font-semibold text-white">{theme.name}</h4>
                                                            <p className="text-gray-400 text-sm">{theme.description}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">Theme not found</p>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Media Preview */}
                                {customMedia && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Custom Background</h3>
                                        <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                            {customMedia.type.startsWith('video/') ? (
                                                <video
                                                    src={URL.createObjectURL(customMedia)}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                />
                                            ) : (
                                                <img
                                                    src={URL.createObjectURL(customMedia)}
                                                    alt="Custom background preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 3 Navigation */}
                            <div className="flex justify-between pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2 inline" />
                                    Back to Themes
                                </button>
                                <div className="flex space-x-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={(e) => handleSubmit(e, true)}
                                        disabled={isLoading}
                                        className="px-6 py-3 border-gray-600 text-gray-300 hover:bg-gray-800"
                                    >
                                        {isDraft ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                                Saving Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save as Draft
                                            </>
                                        )}
                                    </Button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating Event...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2 inline" />
                                                Create Event
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Theme Selection */}
                    {currentStep === 2 && (
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></span>
                                Choose Your Style
                            </h2>

                            {!showThemes ? (
                                <div className="space-y-6">
                                    {/* Explore Themes Option */}
                                    <div
                                        onClick={() => setShowThemes(true)}
                                        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:border-purple-500 group"
                                    >
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <Palette className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                                Explore Themes
                                            </h3>
                                            <p className="text-gray-400">
                                                Choose from our curated collection of beautiful event themes
                                            </p>
                                        </div>
                                    </div>

                                    {/* Custom Media Option */}
                                    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">
                                                Upload Custom Media
                                            </h3>
                                            <p className="text-gray-400 mb-4">
                                                Use your own image or video as the event background
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*,video/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        handleCustomMediaUpload(file)
                                                    }
                                                }}
                                                className="hidden"
                                                id="custom-media-upload"
                                            />
                                            <label
                                                htmlFor="custom-media-upload"
                                                className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 cursor-pointer font-medium"
                                            >
                                                Choose File
                                            </label>
                                            {customMedia && (
                                                <div className="mt-4 space-y-3">
                                                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                                        <p className="text-green-300 text-sm">
                                                            ✓ {customMedia.name} uploaded
                                                        </p>
                                                    </div>
                                                    {/* Media Preview */}
                                                    <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                                        {customMedia.type.startsWith('video/') ? (
                                                            <video
                                                                src={URL.createObjectURL(customMedia)}
                                                                className="w-full h-full object-cover"
                                                                controls
                                                            />
                                                        ) : (
                                                            <img
                                                                src={URL.createObjectURL(customMedia)}
                                                                alt="Custom media preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {Object.keys(themes.reduce((acc, theme) => ({ ...acc, [theme.category]: true }), {})).map(category => (
                                        <div key={category}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <h3 className="text-lg font-semibold">{getCategoryDisplayName(category)}</h3>
                                                    <span className="ml-3 px-3 py-1 text-sm rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/30">
                                                        {getThemesByCategory(category).length} themes
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                                                    onClick={() => toggleCategoryExpansion(category)}
                                                >
                                                    Explore All <span className={`ml-1 transition-transform ${expandedCategories.has(category) ? 'rotate-90' : ''}`}>→</span>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {getThemesByCategory(category).slice(0, expandedCategories.has(category) ? undefined : 2).map((theme) => (
                                                    <div
                                                        key={theme.id}
                                                        className={`bg-gray-800/60 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl relative overflow-hidden ${selectedTheme === theme.id
                                                            ? 'border-purple-500 shadow-lg shadow-purple-500/25 bg-purple-500/5'
                                                            : 'border-gray-700 hover:border-gray-600'
                                                            }`}
                                                        onClick={() => selectTheme(theme.id)}
                                                    >
                                                        <div className="mb-4">
                                                            <div
                                                                className="h-20 rounded-xl flex items-center justify-center relative overflow-hidden"
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                                                                }}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12"></div>
                                                                <span className="text-white font-medium relative z-10 text-sm">{theme.preview}</span>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-semibold text-lg mb-2">{theme.name}</h4>
                                                        <p className="text-gray-400 text-sm">{theme.description}</p>
                                                        <div className="mt-4 flex justify-end">
                                                            <div className={`w-5 h-5 rounded-full border-2 ${selectedTheme === theme.id ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`}>
                                                                {selectedTheme === theme.id && (
                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Step 2 Navigation */}
                            <div className="flex justify-between pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/60 hover:text-white transition-all duration-300 font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2 inline" />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canProceedToStep3()}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    Continue to Settings
                                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Media & Final Settings */}
                    {currentStep === 3 && (
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-4"></span>
                                Media & Final Settings
                            </h2>

                            <div className="space-y-8">
                                {/* Event Media Upload */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Event Media</h3>
                                    <p className="text-gray-400 mb-4">Add photos and videos to showcase your event</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {eventMedia.map((media, index) => (
                                            <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                                {media.mediaType === 'video' ? (
                                                    <video
                                                        src={media.mediaUrl}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                ) : (
                                                    <img
                                                        src={media.mediaUrl}
                                                        alt={media.title || 'Event media'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                                    <p className="text-white text-sm font-medium">{media.title || 'Untitled'}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Media Button */}
                                        <EventMediaUpload
                                            allowPreCreation={true}
                                            onMediaUploaded={(media) => setEventMedia(prev => [...prev, media])}
                                        >
                                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer">
                                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-400">Add Media</p>
                                            </div>
                                        </EventMediaUpload>
                                    </div>
                                </div>

                                {/* Theme Preview */}
                                {selectedTheme && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Selected Theme</h3>
                                        <div className="p-4 bg-gray-800 rounded-lg">
                                            {(() => {
                                                const theme = themes.find(t => t.id === selectedTheme) || mockThemes.find(t => t.id === selectedTheme)
                                                return theme ? (
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className="w-16 h-16 rounded-lg"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                                                            }}
                                                        ></div>
                                                        <div>
                                                            <h4 className="font-semibold text-white">{theme.name}</h4>
                                                            <p className="text-gray-400 text-sm">{theme.description}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">Theme not found</p>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Media Preview */}
                                {customMedia && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Custom Background</h3>
                                        <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                            {customMedia.type.startsWith('video/') ? (
                                                <video
                                                    src={URL.createObjectURL(customMedia)}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                />
                                            ) : (
                                                <img
                                                    src={URL.createObjectURL(customMedia)}
                                                    alt="Custom background preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Advanced Settings Summary */}
                                <div className="bg-gray-800/40 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-3">Event Settings</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Community Enabled:</span>
                                            <span className={advancedSettings.enableCommunity ? "text-green-400" : "text-gray-500"}>
                                                {advancedSettings.enableCommunity ? "Yes" : "No"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Repeating Event:</span>
                                            <span className={advancedSettings.isRepeating ? "text-green-400" : "text-gray-500"}>
                                                {advancedSettings.isRepeating ? "Yes" : "No"}
                                            </span>
                                        </div>
                                        {advancedSettings.isRepeating && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Repeat Pattern:</span>
                                                    <span className="text-white capitalize">
                                                        {advancedSettings.repeatInterval > 1 ? `Every ${advancedSettings.repeatInterval} ` : 'Every '}
                                                        {advancedSettings.repeatPattern === 'daily' ? (advancedSettings.repeatInterval === 1 ? 'day' : 'days') :
                                                         advancedSettings.repeatPattern === 'weekly' ? (advancedSettings.repeatInterval === 1 ? 'week' : 'weeks') :
                                                         advancedSettings.repeatPattern === 'monthly' ? (advancedSettings.repeatInterval === 1 ? 'month' : 'months') :
                                                         advancedSettings.repeatPattern === 'yearly' ? (advancedSettings.repeatInterval === 1 ? 'year' : 'years') : advancedSettings.repeatPattern}
                                                    </span>
                                                </div>
                                                {advancedSettings.repeatPattern === 'weekly' && advancedSettings.repeatDaysOfWeek && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Days:</span>
                                                        <span className="text-white">
                                                            {advancedSettings.repeatDaysOfWeek.split(',').map(day => {
                                                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                                return dayNames[parseInt(day)];
                                                            }).join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {advancedSettings.repeatEndDate && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Ends:</span>
                                                        <span className="text-white">
                                                            {new Date(advancedSettings.repeatEndDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {advancedSettings.enableCommunity && advancedSettings.communityName && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Community Name:</span>
                                                <span className="text-white">{advancedSettings.communityName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 Navigation */}
                            <div className="flex justify-between pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2 inline" />
                                    Back to Themes
                                </button>
                                <div className="flex space-x-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={(e) => handleSubmit(e, true)}
                                        disabled={isLoading}
                                        className="px-6 py-3 border-gray-600 text-gray-300 hover:bg-gray-800"
                                    >
                                        {isDraft ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                                Saving Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save as Draft
                                            </>
                                        )}
                                    </Button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating Event...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2 inline" />
                                                Create Event
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, MapPin, Clock, Users, Camera, Palette, Repeat, MessageCircle, Upload, Check, ArrowLeft, ArrowRight } from "lucide-react"

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
        enableCommunity: false,
        communityName: "",
        invitationMessage: ""
    })

    const [mediaFiles, setMediaFiles] = useState<File[]>([])
    const [dragOver, setDragOver] = useState(false)

    // Mock themes data based on corpus
    const themes: EventTheme[] = [
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

    const handleAdvancedSettingChange = (field: keyof AdvancedSettings, value: string | boolean) => {
        setAdvancedSettings(prev => ({
            ...prev,
            [field]: value
        }))
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const eventFormData = new FormData()

            // Add form fields
            Object.entries(formData).forEach(([key, value]) => {
                eventFormData.append(key, value.toString())
            })

            // Add selected theme
            eventFormData.append("themeId", selectedTheme)

            // Add advanced settings
            Object.entries(advancedSettings).forEach(([key, value]) => {
                eventFormData.append(key, value.toString())
            })

            // Add media files
            mediaFiles.forEach((file, index) => {
                eventFormData.append(`media_${index}`, file)
            })

            const response = await fetch("/api/events", {
                method: "POST",
                body: eventFormData
            })

            if (response.ok) {
                const result = await response.json()
                router.push(`/events/${result.eventId}`)
            } else {
                const error = await response.json()
                console.error("Error creating event:", error)
                alert("Failed to create event. Please try again.")
            }
        } catch (error) {
            console.error("Error creating event:", error)
            alert("Failed to create event. Please try again.")
        } finally {
            setIsLoading(false)
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

                {/* Step Labels */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-16 text-sm">
                        <span className={`transition-colors ${currentStep === 1 ? 'text-purple-400 font-semibold' : 'text-gray-500'}`}>
                            Event Details
                        </span>
                        <span className={`transition-colors ${currentStep === 2 ? 'text-purple-400 font-semibold' : 'text-gray-500'}`}>
                            Style & Theme
                        </span>
                        <span className={`transition-colors ${currentStep === 3 ? 'text-purple-400 font-semibold' : 'text-gray-500'}`}>
                            Settings & Media
                        </span>
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
                                    <Input
                                        type="text"
                                        placeholder="Where is your event?"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange("location", e.target.value)}
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

                            {/* Step 1 Navigation */}
                            <div className="flex justify-end pt-6">
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
                                                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                                    <p className="text-green-300 text-sm">
                                                        ✓ {customMedia.name} uploaded
                                                    </p>
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

                    {/* Step 3: Advanced Settings */}
                    {currentStep === 3 && (
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-4"></span>
                                Settings & Media
                            </h2>

                            <div className="space-y-8">
                                {/* Repeating Event */}
                                <div className="flex items-center justify-between p-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Repeating Event</h3>
                                            <p className="text-gray-400">Create a recurring event series</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={advancedSettings.isRepeating}
                                        onCheckedChange={(checked) => handleAdvancedSettingChange('isRepeating', checked)}
                                    />
                                </div>

                                {/* Community Settings */}
                                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Enable Community</h3>
                                                <p className="text-gray-400">Create a community chat for participants</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={advancedSettings.enableCommunity}
                                            onCheckedChange={(checked) => handleAdvancedSettingChange('enableCommunity', checked)}
                                        />
                                    </div>

                                    {advancedSettings.enableCommunity && (
                                        <div className="space-y-6 animate-slide-up">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                                    Invitation Message
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        rows={3}
                                                        placeholder="e.g., Join me for a coffee meetup, Come hiking with me..."
                                                        maxLength={200}
                                                        value={advancedSettings.invitationMessage}
                                                        onChange={(e) => handleAdvancedSettingChange('invitationMessage', e.target.value)}
                                                        className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 resize-none"
                                                    />
                                                    <div className="absolute bottom-3 right-3">
                                                        <span id="invite-char-count" className="text-xs text-gray-500">{advancedSettings.invitationMessage.length}/200</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                                    Community Name
                                                </label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Name your community..."
                                                        value={advancedSettings.communityName}
                                                        onChange={(e) => handleAdvancedSettingChange('communityName', e.target.value)}
                                                        className="flex-1 px-4 py-4 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                                    />
                                                    <button type="button" className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                                                        Generate
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-2">People who join will be added to this community chat</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Media Upload */}
                                <div>
                                    <label className="block text-lg font-semibold mb-4">
                                        Event Media
                                    </label>
                                    <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 hover:bg-purple-500/5 rounded-2xl p-8 text-center transition-all duration-300">
                                        <div className="mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Add Event Media</h3>
                                        <p className="text-gray-400 mb-4">Upload images and videos to showcase your event</p>
                                        <p className="text-sm text-gray-500">Multiple files supported • Max 50MB per file</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || [])
                                                setMediaFiles(prev => [...prev, ...files])
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 Navigation */}
                            <div className="flex justify-between pt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/60 hover:text-white transition-all duration-300 font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2 inline" />
                                    Back
                                </button>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/60 hover:text-white transition-all duration-300 font-medium"
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !formData.title || !formData.date || !formData.time || (!selectedTheme && !customMedia)}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating Event...
                                            </div>
                                        ) : (
                                            "Create Event"
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
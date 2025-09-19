"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Calendar, MapPin, Clock, Users, Camera, Palette, Repeat, MessageCircle, Upload, Check } from "lucide-react"

interface EventTheme {
    id: string
    name: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    category: string
    preview: string
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
    const [themes, setThemes] = useState<EventTheme[]>([])
    const [selectedTheme, setSelectedTheme] = useState<string>("")
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

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
    const mockThemes: EventTheme[] = [
        {
            id: "elegant-corporate",
            name: "Elegant Corporate",
            primaryColor: "#374151",
            secondaryColor: "#6B7280",
            accentColor: "#9CA3AF",
            category: "business",
            preview: "Q4 Strategy Meeting"
        },
        {
            id: "modern-business",
            name: "Modern Business",
            primaryColor: "#2563EB",
            secondaryColor: "#3B82F6",
            accentColor: "#6366F1",
            category: "business",
            preview: "Product Launch"
        },
        {
            id: "minimal-tech",
            name: "Minimal Tech",
            primaryColor: "#475569",
            secondaryColor: "#64748B",
            accentColor: "#94A3B8",
            category: "business",
            preview: "AI Conference 2024"
        },
        {
            id: "neon-glow",
            name: "Neon Glow",
            primaryColor: "#9333EA",
            secondaryColor: "#EC4899",
            accentColor: "#8B5CF6",
            category: "party",
            preview: "New Year's Eve"
        },
        {
            id: "vibrant-party",
            name: "Vibrant Party",
            primaryColor: "#F97316",
            secondaryColor: "#EF4444",
            accentColor: "#EC4899",
            category: "party",
            preview: "Birthday Celebration"
        },
        {
            id: "elegant-wedding",
            name: "Elegant Wedding",
            primaryColor: "#FB7185",
            secondaryColor: "#F9A8D4",
            accentColor: "#FBBF24",
            category: "party",
            preview: "Sarah & John's Wedding"
        },
        {
            id: "festival-fun",
            name: "Festival Fun",
            primaryColor: "#FBBF24",
            secondaryColor: "#FB923C",
            accentColor: "#EF4444",
            category: "party",
            preview: "Summer Music Festival"
        },
        {
            id: "friendly-gather",
            name: "Friendly Gather",
            primaryColor: "#10B981",
            secondaryColor: "#059669",
            accentColor: "#34D399",
            category: "community",
            preview: "Neighborhood BBQ"
        },
        {
            id: "cozy-meetup",
            name: "Cozy Meetup",
            primaryColor: "#F59E0B",
            secondaryColor: "#D97706",
            accentColor: "#FBBF24",
            category: "community",
            preview: "Book Club Meeting"
        },
        {
            id: "charity-event",
            name: "Charity Event",
            primaryColor: "#14B8A6",
            secondaryColor: "#06B6D4",
            accentColor: "#0EA5E9",
            category: "community",
            preview: "Charity Fundraiser"
        }
    ]

    useEffect(() => {
        setThemes(mockThemes)
    }, [])

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

    const toggleCategory = (category: string) => {
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        setMediaFiles(prev => [...prev, ...files])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setMediaFiles(prev => [...prev, ...files])
    }

    const removeFile = (index: number) => {
        setMediaFiles(files => files.filter((_, i) => i !== index))
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans antialiased">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-blue-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                        <Calendar className="w-8 h-8 text-white" />
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
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg' : 'bg-gray-700 border-gray-600'
                            }`}>
                            <span className="text-sm font-semibold">1</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-600"></div>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg' : 'bg-gray-700 border-gray-600'
                            }`}>
                            <span className="text-sm font-semibold">2</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-600"></div>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 shadow-lg' : 'bg-gray-700 border-gray-600'
                            }`}>
                            <span className="text-sm font-semibold">3</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-4"></span>
                            Event Details
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Event Title */}
                            <div className="lg:col-span-2">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder=" "
                                        value={formData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white placeholder-transparent transition-all duration-300 rounded-none"
                                    />
                                    <Label className={`absolute left-4 transition-all duration-300 pointer-events-none ${formData.title ? 'top-0 text-xs text-purple-500 bg-gray-800 px-2' : 'top-4 text-base text-gray-400'
                                        }`}>
                                        Event Title *
                                    </Label>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="lg:col-span-2">
                                <div className="relative">
                                    <Textarea
                                        rows={4}
                                        placeholder=" "
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white placeholder-transparent resize-none transition-all duration-300 rounded-none"
                                    />
                                    <Label className={`absolute left-4 transition-all duration-300 pointer-events-none ${formData.description ? 'top-0 text-xs text-purple-500 bg-gray-800 px-2' : 'top-4 text-base text-gray-400'
                                        }`}>
                                        Description *
                                    </Label>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder=" "
                                        value={formData.location}
                                        onChange={(e) => handleInputChange("location", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white placeholder-transparent transition-all duration-300 rounded-none"
                                    />
                                    <Label className={`absolute left-4 transition-all duration-300 pointer-events-none ${formData.location ? 'top-0 text-xs text-purple-500 bg-gray-800 px-2' : 'top-4 text-base text-gray-400'
                                        }`}>
                                        Location *
                                    </Label>
                                </div>
                            </div>

                            {/* Max Participants */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder=" "
                                        value={formData.maxAttendees}
                                        onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white placeholder-transparent transition-all duration-300 rounded-none"
                                    />
                                    <Label className={`absolute left-4 transition-all duration-300 pointer-events-none ${formData.maxAttendees ? 'top-0 text-xs text-purple-500 bg-gray-800 px-2' : 'top-4 text-base text-gray-400'
                                        }`}>
                                        Max Participants
                                    </Label>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange("date", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white transition-all duration-300 rounded-none"
                                    />
                                    <Label className="absolute -top-2 left-3 text-xs text-purple-500 bg-gray-800 px-2">Date *</Label>
                                </div>
                            </div>

                            {/* Time */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => handleInputChange("time", e.target.value)}
                                        required
                                        className="w-full px-4 py-4 text-lg bg-transparent border-0 border-b border-gray-600 focus:outline-none focus:border-purple-500 text-white transition-all duration-300 rounded-none"
                                    />
                                    <Label className="absolute -top-2 left-3 text-xs text-purple-500 bg-gray-800 px-2">Time *</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></span>
                            Choose Your Style
                        </h2>

                        <div className="space-y-8">
                            {['business', 'party', 'community'].map((category) => (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <h3 className="text-lg font-semibold">{getCategoryDisplayName(category)}</h3>
                                            <span className="ml-3 px-3 py-1 text-sm rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/30">
                                                {getThemesByCategory(category).length} themes
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => toggleCategory(category)}
                                            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                                        >
                                            Explore All <span className={`ml-1 transition-transform ${expandedCategories.has(category) ? 'rotate-90' : ''}`}>→</span>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getThemesByCategory(category).slice(0, expandedCategories.has(category) ? undefined : 2).map((theme) => (
                                            <div
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`bg-gray-800/60 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl ${selectedTheme === theme.id
                                                        ? 'border-purple-500 shadow-lg shadow-purple-500/25 bg-purple-500/5'
                                                        : 'border-gray-700 hover:border-gray-600'
                                                    }`}
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
                                                <p className="text-gray-400 text-sm mb-4">Perfect for {category} events</p>
                                                <div className="flex justify-end">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedTheme === theme.id
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-gray-500'
                                                        }`}>
                                                        {selectedTheme === theme.id && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:border-gray-600 hover:shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-4"></span>
                            Advanced Settings
                        </h2>

                        <div className="space-y-8">
                            {/* Repeating Event */}
                            <div className="flex items-center justify-between p-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <Repeat className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Repeating Event</h3>
                                        <p className="text-gray-400">Create a recurring event series</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={advancedSettings.isRepeating}
                                    onCheckedChange={(checked) => handleAdvancedSettingChange("isRepeating", checked)}
                                />
                            </div>

                            {/* Community Settings */}
                            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <MessageCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Enable Community</h3>
                                            <p className="text-gray-400">Create a community chat for participants</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={advancedSettings.enableCommunity}
                                        onCheckedChange={(checked) => handleAdvancedSettingChange("enableCommunity", checked)}
                                    />
                                </div>

                                {advancedSettings.enableCommunity && (
                                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-300 mb-3">
                                                Invitation Message
                                            </Label>
                                            <div className="relative">
                                                <Textarea
                                                    rows={3}
                                                    placeholder="e.g., Join me for a coffee meetup, Come hiking with me..."
                                                    maxLength={200}
                                                    value={advancedSettings.invitationMessage}
                                                    onChange={(e) => handleAdvancedSettingChange("invitationMessage", e.target.value)}
                                                    className="w-full px-4 py-4 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 resize-none"
                                                />
                                                <div className="absolute bottom-3 right-3">
                                                    <span className="text-xs text-gray-500">{advancedSettings.invitationMessage.length}/200</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-medium text-gray-300 mb-3">
                                                Community Name
                                            </Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    type="text"
                                                    placeholder="Name your community..."
                                                    value={advancedSettings.communityName}
                                                    onChange={(e) => handleAdvancedSettingChange("communityName", e.target.value)}
                                                    className="flex-1 px-4 py-4 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                                />
                                                <Button
                                                    type="button"
                                                    className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                                                >
                                                    Generate
                                                </Button>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-2">People who join will be added to this community chat</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Media Upload */}
                            <div>
                                <Label className="block text-lg font-semibold mb-4">
                                    Event Media
                                </Label>
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragOver
                                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/30'
                                            : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Add Event Media</h3>
                                    <p className="text-gray-400 mb-4">Upload images and videos to showcase your event</p>
                                    <p className="text-sm text-gray-500 mb-4">Multiple files supported • Max 50MB per file</p>

                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="media-upload"
                                    />
                                    <Label htmlFor="media-upload" className="cursor-pointer">
                                        <Button type="button" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                                            Choose Files
                                        </Button>
                                    </Label>

                                    {mediaFiles.length > 0 && (
                                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {mediaFiles.map((file, index) => (
                                                <div key={index} className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl p-3">
                                                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                                    <Button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-0 text-xs"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Privacy Setting */}
                            <div className="flex items-center justify-between p-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl">
                                <div>
                                    <h3 className="font-semibold text-lg">Public Event</h3>
                                    <p className="text-gray-400">Anyone can see and join this event</p>
                                </div>
                                <Switch
                                    checked={formData.isPublic}
                                    onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 px-8 py-4 bg-gray-800/60 backdrop-blur-xl border border-gray-700 text-white rounded-xl hover:bg-gray-700/60 transition-all duration-300 text-lg font-medium"
                        >
                            Save as Draft
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.title || !formData.date || !formData.time || !selectedTheme}
                            className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Event...
                                </div>
                            ) : (
                                "Create Event"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
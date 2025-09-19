"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"
import type { EventTheme } from "./ThemeSelector"

interface FlyerGeneratorProps {
  event: {
    title: string
    description: string
    location: string
    date: string
    time: string
    createdByUsername: string
  }
  theme?: EventTheme | null
  customBackground?: string
  onDownload?: () => void
  onPreview?: () => void
}

export function FlyerGenerator({ event, theme, customBackground, onDownload, onPreview }: FlyerGeneratorProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    }
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const dateInfo = formatDate(event.date)

  // Default theme fallback
  const flyerTheme = theme || {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    fontFamily: 'Inter',
    fontWeight: '500',
    borderRadius: 16,
    shadowIntensity: 'high'
  }

  return (
    <div className="space-y-4">
      {/* Flyer Preview */}
      <Card 
        className="relative overflow-hidden aspect-[3/4] w-full max-w-sm mx-auto border-0"
        style={{ 
          borderRadius: `${flyerTheme.borderRadius}px`,
          fontFamily: flyerTheme.fontFamily
        }}
      >
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: customBackground 
              ? `url(${customBackground})` 
              : flyerTheme.backgroundGradient,
            backgroundSize: customBackground ? 'cover' : 'auto',
            backgroundPosition: customBackground ? 'center' : 'auto'
          }}
        >
          {/* Overlay for custom backgrounds to ensure text readability */}
          {customBackground && (
            <div 
              className="absolute inset-0 bg-black opacity-40"
            />
          )}
          
          {/* Decorative elements - only show if no custom background */}
          {!customBackground && (
            <>
              <div 
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
                style={{ backgroundColor: flyerTheme.accentColor }}
              />
              <div 
                className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-10"
                style={{ backgroundColor: flyerTheme.secondaryColor }}
              />
              <div 
                className="absolute top-1/3 -right-6 w-16 h-16 rounded-full opacity-15"
                style={{ backgroundColor: flyerTheme.textColor }}
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div 
                className="text-center p-3 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: `${flyerTheme.textColor}20`,
                  border: `2px solid ${flyerTheme.accentColor}30`
                }}
              >
                <div 
                  className="text-2xl font-bold leading-none"
                  style={{ 
                    color: flyerTheme.textColor,
                    fontWeight: flyerTheme.fontWeight
                  }}
                >
                  {dateInfo.day}
                </div>
                <div 
                  className="text-xs font-medium"
                  style={{ color: flyerTheme.accentColor }}
                >
                  {dateInfo.month}
                </div>
              </div>
            </div>
            
            <h1 
              className="text-2xl font-bold leading-tight mb-2"
              style={{ 
                color: flyerTheme.textColor,
                fontFamily: flyerTheme.fontFamily,
                fontWeight: flyerTheme.fontWeight
              }}
            >
              {event.title}
            </h1>
            
            <p 
              className="text-sm opacity-90 line-clamp-2"
              style={{ color: flyerTheme.textColor }}
            >
              {event.description}
            </p>
          </div>

          {/* Event Details */}
          <div className="flex-1 space-y-4">
            <div 
              className="bg-black/20 backdrop-blur-sm rounded-lg p-4 space-y-3"
              style={{ borderRadius: `${flyerTheme.borderRadius / 2}px` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: flyerTheme.accentColor }}
                />
                <div>
                  <div 
                    className="text-xs font-medium opacity-75"
                    style={{ color: flyerTheme.textColor }}
                  >
                    Date & Time
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: flyerTheme.textColor }}
                  >
                    {dateInfo.weekday}, {dateInfo.month} {dateInfo.day} • {formatTime(event.time)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: flyerTheme.accentColor }}
                />
                <div>
                  <div 
                    className="text-xs font-medium opacity-75"
                    style={{ color: flyerTheme.textColor }}
                  >
                    Location
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: flyerTheme.textColor }}
                  >
                    {event.location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div 
              className="text-xs opacity-75"
              style={{ color: flyerTheme.textColor }}
            >
              Hosted by
            </div>
            <div 
              className="text-sm font-semibold"
              style={{ 
                color: flyerTheme.accentColor,
                fontWeight: flyerTheme.fontWeight
              }}
            >
              @{event.createdByUsername}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={onDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}
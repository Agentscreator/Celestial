"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

export interface EventTheme {
  id: number
  name: string
  displayName: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  backgroundGradient: string
  fontFamily: string
  fontWeight: string
  borderRadius: number
  shadowIntensity: string
  category: string
}

interface ThemeSelectorProps {
  themes: EventTheme[]
  selectedThemeId: number | null
  onThemeSelect: (themeId: number | null) => void
  className?: string
}

const categoryLabels: Record<string, string> = {
  business: "Business & Professional",
  party: "Party & Celebration", 
  sports: "Sports & Fitness",
  creative: "Creative & Arts",
  social: "Community & Social",
  seasonal: "Seasonal"
}

const categoryColors: Record<string, string> = {
  business: "bg-blue-100 text-blue-800",
  party: "bg-pink-100 text-pink-800",
  sports: "bg-green-100 text-green-800", 
  creative: "bg-purple-100 text-purple-800",
  social: "bg-cyan-100 text-cyan-800",
  seasonal: "bg-amber-100 text-amber-800"
}

export function ThemeSelector({ themes, selectedThemeId, onThemeSelect, className }: ThemeSelectorProps) {
  const themesByCategory = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = []
    }
    acc[theme.category].push(theme)
    return acc
  }, {} as Record<string, EventTheme[]>)

  const getShadowClass = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'shadow-sm'
      case 'medium': return 'shadow-md'
      case 'high': return 'shadow-lg'
      default: return 'shadow-md'
    }
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium mb-4 block">Event Theme</Label>
      
      {/* Default theme option */}
      <Card 
        className={`p-4 mb-4 cursor-pointer transition-all border-2 ${
          selectedThemeId === null 
            ? 'border-blue-500 bg-blue-50/10' 
            : 'border-gray-600 hover:border-gray-500'
        } bg-gray-800`}
        onClick={() => onThemeSelect(null)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Default Theme</h3>
            <p className="text-sm text-gray-400">Use the standard event appearance</p>
          </div>
          {selectedThemeId === null && (
            <Check className="h-5 w-5 text-blue-500" />
          )}
        </div>
      </Card>

      {/* Theme categories */}
      {Object.entries(themesByCategory).map(([category, categoryThemes]) => (
        <div key={category} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              {categoryLabels[category] || category}
            </h4>
            <Badge variant="secondary" className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
              {categoryThemes.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryThemes.map((theme) => (
              <Card
                key={theme.id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedThemeId === theme.id
                    ? 'border-blue-500 bg-blue-50/10'
                    : 'border-gray-600 hover:border-gray-500'
                } bg-gray-800 overflow-hidden`}
                onClick={() => onThemeSelect(theme.id)}
                style={{
                  borderRadius: `${theme.borderRadius}px`
                }}
              >
                {/* Theme preview */}
                <div 
                  className={`-mx-4 -mt-4 mb-3 h-16 ${getShadowClass(theme.shadowIntensity)}`}
                  style={{ 
                    background: theme.backgroundGradient,
                    borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 0 0`
                  }}
                >
                  <div className="h-full flex items-center justify-center">
                    <div 
                      className="text-sm font-medium px-3 py-1 rounded"
                      style={{ 
                        color: theme.textColor,
                        fontFamily: theme.fontFamily,
                        fontWeight: theme.fontWeight,
                        backgroundColor: `${theme.accentColor}20`,
                        border: `1px solid ${theme.accentColor}40`
                      }}
                    >
                      Sample Event
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-medium text-white truncate"
                      style={{ 
                        fontFamily: theme.fontFamily,
                        fontWeight: theme.fontWeight
                      }}
                    >
                      {theme.displayName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {theme.description}
                    </p>
                    
                    {/* Color palette */}
                    <div className="flex gap-1 mt-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.primaryColor }}
                        title="Primary"
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title="Secondary"
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.accentColor }}
                        title="Accent"
                      />
                    </div>
                  </div>
                  
                  {selectedThemeId === theme.id && (
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
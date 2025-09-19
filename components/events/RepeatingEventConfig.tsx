"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Repeat, X } from "lucide-react"

interface RepeatingEventConfigProps {
  isRepeating: boolean
  onRepeatingChange: (isRepeating: boolean) => void
  repeatPattern: string
  onRepeatPatternChange: (pattern: string) => void
  repeatInterval: number
  onRepeatIntervalChange: (interval: number) => void
  repeatEndDate?: string
  onRepeatEndDateChange: (date?: string) => void
  repeatDaysOfWeek?: string
  onRepeatDaysOfWeekChange: (days?: string) => void
  eventDate: string
  className?: string
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Mon', name: 'Monday' },
  { value: '2', label: 'Tue', name: 'Tuesday' },
  { value: '3', label: 'Wed', name: 'Wednesday' },
  { value: '4', label: 'Thu', name: 'Thursday' },
  { value: '5', label: 'Fri', name: 'Friday' },
  { value: '6', label: 'Sat', name: 'Saturday' },
  { value: '0', label: 'Sun', name: 'Sunday' },
]

export function RepeatingEventConfig({
  isRepeating,
  onRepeatingChange,
  repeatPattern,
  onRepeatPatternChange,
  repeatInterval,
  onRepeatIntervalChange,
  repeatEndDate,
  onRepeatEndDateChange,
  repeatDaysOfWeek,
  onRepeatDaysOfWeekChange,
  eventDate,
  className = ""
}: RepeatingEventConfigProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  // Initialize selected days from repeatDaysOfWeek
  useEffect(() => {
    if (repeatDaysOfWeek) {
      setSelectedDays(repeatDaysOfWeek.split(',').filter(Boolean))
    } else {
      setSelectedDays([])
    }
  }, [repeatDaysOfWeek])

  // Update repeatDaysOfWeek when selectedDays changes
  useEffect(() => {
    if (repeatPattern === 'weekly') {
      onRepeatDaysOfWeekChange(selectedDays.length > 0 ? selectedDays.join(',') : undefined)
    }
  }, [selectedDays, repeatPattern, onRepeatDaysOfWeekChange])

  // Toggle day selection
  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue)
      } else {
        return [...prev, dayValue].sort()
      }
    })
  }

  // Generate preview of next few occurrences
  const generatePreview = () => {
    if (!isRepeating || !eventDate) return []

    const startDate = new Date(eventDate)
    const previews: string[] = []
    let currentDate = new Date(startDate)

    for (let i = 0; i < 5; i++) {
      if (i === 0) {
        previews.push(formatPreviewDate(currentDate))
      } else {
        switch (repeatPattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + repeatInterval)
            break
          case 'weekly':
            if (repeatPattern === 'weekly' && selectedDays.length > 0) {
              // For weekly with specific days, find next occurrence
              let found = false
              for (let j = 1; j <= 7 * repeatInterval; j++) {
                const testDate = new Date(startDate)
                testDate.setDate(testDate.getDate() + j)
                const dayOfWeek = testDate.getDay().toString()
                
                if (selectedDays.includes(dayOfWeek)) {
                  currentDate = testDate
                  found = true
                  break
                }
              }
              if (!found) break
            } else {
              currentDate.setDate(currentDate.getDate() + (7 * repeatInterval))
            }
            break
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + repeatInterval)
            break
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + repeatInterval)
            break
        }

        // Check if we've passed the end date
        if (repeatEndDate && currentDate > new Date(repeatEndDate)) {
          break
        }

        previews.push(formatPreviewDate(currentDate))
      }
    }

    return previews
  }

  const formatPreviewDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPatternDescription = () => {
    if (!isRepeating) return ""

    let description = `Every `
    
    if (repeatInterval > 1) {
      description += `${repeatInterval} `
    }

    switch (repeatPattern) {
      case 'daily':
        description += repeatInterval === 1 ? 'day' : 'days'
        break
      case 'weekly':
        if (selectedDays.length > 0) {
          const dayNames = selectedDays.map(day => 
            DAYS_OF_WEEK.find(d => d.value === day)?.label
          ).join(', ')
          description += repeatInterval === 1 ? `week on ${dayNames}` : `${repeatInterval} weeks on ${dayNames}`
        } else {
          description += repeatInterval === 1 ? 'week' : 'weeks'
        }
        break
      case 'monthly':
        description += repeatInterval === 1 ? 'month' : 'months'
        break
      case 'yearly':
        description += repeatInterval === 1 ? 'year' : 'years'
        break
    }

    if (repeatEndDate) {
      description += ` until ${new Date(repeatEndDate).toLocaleDateString()}`
    }

    return description
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Repeating */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Repeating Event</Label>
          <p className="text-sm text-gray-400">Create a recurring event series</p>
        </div>
        <Switch
          checked={isRepeating}
          onCheckedChange={onRepeatingChange}
        />
      </div>

      {isRepeating && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Repeat Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Repeat Pattern */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="repeat-pattern">Repeat Pattern</Label>
                <Select value={repeatPattern} onValueChange={onRepeatPatternChange}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="repeat-interval">Every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="repeat-interval"
                    type="number"
                    min="1"
                    max="52"
                    value={repeatInterval}
                    onChange={(e) => onRepeatIntervalChange(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <span className="text-sm text-gray-400">
                    {repeatPattern === 'daily' ? 'day(s)' :
                     repeatPattern === 'weekly' ? 'week(s)' :
                     repeatPattern === 'monthly' ? 'month(s)' :
                     'year(s)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Days of Week Selection for Weekly */}
            {repeatPattern === 'weekly' && (
              <div>
                <Label className="text-sm font-medium">Days of Week</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      className={`${
                        selectedDays.includes(day.value) 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Select at least one day of the week
                  </p>
                )}
              </div>
            )}

            {/* End Date */}
            <div>
              <Label htmlFor="repeat-end-date">End Date (optional)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="repeat-end-date"
                  type="date"
                  value={repeatEndDate || ''}
                  onChange={(e) => onRepeatEndDateChange(e.target.value || undefined)}
                  min={eventDate}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                {repeatEndDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRepeatEndDateChange(undefined)}
                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Leave empty for indefinite repeating
              </p>
            </div>

            {/* Pattern Description */}
            {getPatternDescription() && (
              <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Repeat Summary
                </div>
                <p className="text-blue-300 text-sm mt-1">
                  {getPatternDescription()}
                </p>
              </div>
            )}

            {/* Preview */}
            {generatePreview().length > 0 && (
              <div>
                <Label className="text-sm font-medium">Next Occurrences</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatePreview().map((date, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`text-xs ${
                        index === 0 
                          ? 'border-green-600 text-green-400' 
                          : 'border-gray-600 text-gray-300'
                      }`}
                    >
                      {index === 0 ? 'First: ' : ''}{date}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
/**
 * Test script to verify repeating event creation functionality
 * This tests the enhanced event creation with repeat time selection
 */

const testRepeatEventCreation = async () => {
  console.log('🧪 Testing Repeating Event Creation...')

  // Test data for a weekly repeating event
  const testEventData = {
    title: "Weekly Team Meeting",
    description: "Our regular team sync meeting",
    location: "Conference Room A",
    date: "2025-01-15", // Next Wednesday
    time: "10:00",
    maxParticipants: 10,
    isPublic: true,
    
    // Repeating event settings
    isRepeating: true,
    repeatPattern: "weekly",
    repeatInterval: 1,
    repeatDaysOfWeek: "1,3,5", // Monday, Wednesday, Friday
    repeatEndDate: "2025-06-15", // End after 6 months
    
    // Community settings
    enableCommunity: true,
    communityName: "Team Meeting Community",
    invitationMessage: "Join our weekly team meetings to stay connected!",
    
    // Theme
    themeId: "modern-business",
    
    isDraft: false
  }

  try {
    console.log('📤 Sending event creation request...')
    console.log('Event data:', JSON.stringify(testEventData, null, 2))

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEventData)
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Event created successfully!')
      console.log('Event ID:', result.event.id)
      console.log('Repeat settings:', {
        isRepeating: result.event.isRepeating,
        repeatPattern: result.event.repeatPattern,
        repeatInterval: result.event.repeatInterval,
        repeatDaysOfWeek: result.event.repeatDaysOfWeek,
        repeatEndDate: result.event.repeatEndDate
      })
      console.log('Share URL:', result.event.shareUrl)
      
      // Test the repeat pattern description
      const getPatternDescription = (event) => {
        if (!event.isRepeating) return "One-time event"
        
        let description = `Every `
        
        if (event.repeatInterval > 1) {
          description += `${event.repeatInterval} `
        }

        switch (event.repeatPattern) {
          case 'daily':
            description += event.repeatInterval === 1 ? 'day' : 'days'
            break
          case 'weekly':
            if (event.repeatDaysOfWeek) {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              const days = event.repeatDaysOfWeek.split(',').map(day => dayNames[parseInt(day)]).join(', ')
              description += event.repeatInterval === 1 ? `week on ${days}` : `${event.repeatInterval} weeks on ${days}`
            } else {
              description += event.repeatInterval === 1 ? 'week' : 'weeks'
            }
            break
          case 'monthly':
            description += event.repeatInterval === 1 ? 'month' : 'months'
            break
          case 'yearly':
            description += event.repeatInterval === 1 ? 'year' : 'years'
            break
        }

        if (event.repeatEndDate) {
          description += ` until ${new Date(event.repeatEndDate).toLocaleDateString()}`
        }

        return description
      }

      console.log('📅 Repeat description:', getPatternDescription(result.event))
      
    } else {
      console.error('❌ Event creation failed:', result.error)
      console.error('Response status:', response.status)
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Test different repeat patterns
const testDifferentPatterns = async () => {
  console.log('\n🧪 Testing Different Repeat Patterns...')

  const patterns = [
    {
      name: "Daily for 30 days",
      data: {
        title: "Daily Standup",
        description: "Quick daily team check-in",
        location: "Virtual",
        date: "2025-01-15",
        time: "09:00",
        isRepeating: true,
        repeatPattern: "daily",
        repeatInterval: 1,
        repeatEndDate: "2025-02-15"
      }
    },
    {
      name: "Bi-weekly on Tuesdays and Thursdays",
      data: {
        title: "Code Review Session",
        description: "Review and discuss code changes",
        location: "Dev Room",
        date: "2025-01-16",
        time: "14:00",
        isRepeating: true,
        repeatPattern: "weekly",
        repeatInterval: 2,
        repeatDaysOfWeek: "2,4", // Tuesday, Thursday
        repeatEndDate: "2025-04-16"
      }
    },
    {
      name: "Monthly on the 15th",
      data: {
        title: "Monthly All-Hands",
        description: "Company-wide monthly meeting",
        location: "Main Auditorium",
        date: "2025-01-15",
        time: "15:00",
        isRepeating: true,
        repeatPattern: "monthly",
        repeatInterval: 1,
        repeatEndDate: "2025-12-15"
      }
    }
  ]

  for (const pattern of patterns) {
    console.log(`\n📋 Testing: ${pattern.name}`)
    console.log('Pattern data:', JSON.stringify(pattern.data, null, 2))
  }
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment')
  // You can call testRepeatEventCreation() from browser console
} else {
  console.log('📝 Test script loaded - call testRepeatEventCreation() to run tests')
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRepeatEventCreation, testDifferentPatterns }
}
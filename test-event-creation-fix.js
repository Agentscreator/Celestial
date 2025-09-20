/**
 * Test script to verify event creation and theme assignment fixes
 * Run this in the browser console after creating an event
 */

async function testEventCreationAndThemes() {
    console.log('🧪 Testing Event Creation and Theme Assignment...')
    
    try {
        // Test 1: Fetch all events and check structure
        console.log('📋 Test 1: Fetching events...')
        const eventsResponse = await fetch('/api/events', {
            method: 'GET',
            credentials: 'include'
        })
        
        if (!eventsResponse.ok) {
            throw new Error(`Events API failed: ${eventsResponse.status}`)
        }
        
        const eventsData = await eventsResponse.json()
        console.log('✅ Events fetched successfully:', eventsData.events?.length || 0, 'events')
        
        if (eventsData.events && eventsData.events.length > 0) {
            const sampleEvent = eventsData.events[0]
            console.log('📝 Sample event structure:', {
                id: sampleEvent.id,
                title: sampleEvent.title,
                themeId: sampleEvent.themeId,
                hasTheme: !!sampleEvent.theme,
                theme: sampleEvent.theme ? {
                    id: sampleEvent.theme.id,
                    name: sampleEvent.theme.name,
                    primaryColor: sampleEvent.theme.primaryColor
                } : null
            })
        }
        
        // Test 2: Fetch available themes
        console.log('🎨 Test 2: Fetching themes...')
        const themesResponse = await fetch('/api/events/themes', {
            method: 'GET',
            credentials: 'include'
        })
        
        if (!themesResponse.ok) {
            throw new Error(`Themes API failed: ${themesResponse.status}`)
        }
        
        const themesData = await themesResponse.json()
        console.log('✅ Themes fetched successfully:', themesData.themes?.length || 0, 'themes')
        
        if (themesData.themes && themesData.themes.length > 0) {
            const sampleTheme = themesData.themes[0]
            console.log('🎨 Sample theme structure:', {
                id: sampleTheme.id,
                name: sampleTheme.name,
                displayName: sampleTheme.displayName,
                primaryColor: sampleTheme.primaryColor,
                category: sampleTheme.category
            })
        }
        
        // Test 3: Test event ID validation
        if (eventsData.events && eventsData.events.length > 0) {
            const testEventId = eventsData.events[0].id
            console.log('🔍 Test 3: Testing event ID validation with ID:', testEventId)
            
            // Test if the event ID can be used to join (this will test the ID parsing)
            const joinResponse = await fetch(`/api/events/${testEventId}/join`, {
                method: 'POST',
                credentials: 'include'
            })
            
            // We expect either success or "Already joined" error, not "Invalid event ID"
            const joinData = await joinResponse.json()
            
            if (joinResponse.status === 400 && joinData.error === "Invalid event ID") {
                console.error('❌ Event ID validation failed - this indicates the bug is still present')
                console.error('Event ID type:', typeof testEventId, 'Value:', testEventId)
            } else {
                console.log('✅ Event ID validation passed')
                console.log('Join response:', joinResponse.status, joinData.error || joinData.message)
            }
        }
        
        console.log('🎉 All tests completed!')
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    }
}

// Auto-run the test
testEventCreationAndThemes()

// Also provide manual test functions
window.testEventCreation = testEventCreationAndThemes

console.log('🧪 Event creation test loaded. Run testEventCreationAndThemes() to test manually.')
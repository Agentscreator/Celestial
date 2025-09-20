/**
 * Script to populate default event themes in the database
 * This ensures themes are available for selection during event creation
 */

const defaultThemes = [
    {
        name: "elegant-corporate",
        displayName: "Elegant Corporate",
        description: "Sophisticated design for executive meetings",
        primaryColor: "#374151",
        secondaryColor: "#6B7280",
        accentColor: "#9CA3AF",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
        fontFamily: "Inter",
        fontWeight: "500",
        borderRadius: 8,
        shadowIntensity: "medium",
        category: "business"
    },
    {
        name: "modern-business",
        displayName: "Modern Business",
        description: "Clean and professional for corporate events",
        primaryColor: "#2563EB",
        secondaryColor: "#3B82F6",
        accentColor: "#6366F1",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
        fontFamily: "Inter",
        fontWeight: "400",
        borderRadius: 12,
        shadowIntensity: "medium",
        category: "business"
    },
    {
        name: "neon-glow",
        displayName: "Neon Glow",
        description: "Electric atmosphere for night events",
        primaryColor: "#9333EA",
        secondaryColor: "#EC4899",
        accentColor: "#8B5CF6",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #9333EA 0%, #EC4899 100%)",
        fontFamily: "Inter",
        fontWeight: "600",
        borderRadius: 16,
        shadowIntensity: "high",
        category: "party"
    },
    {
        name: "vibrant-party",
        displayName: "Vibrant Party",
        description: "Colorful and energetic for celebrations",
        primaryColor: "#F97316",
        secondaryColor: "#EF4444",
        accentColor: "#EC4899",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)",
        fontFamily: "Inter",
        fontWeight: "500",
        borderRadius: 20,
        shadowIntensity: "high",
        category: "party"
    },
    {
        name: "friendly-gather",
        displayName: "Friendly Gather",
        description: "Warm and welcoming for social events",
        primaryColor: "#10B981",
        secondaryColor: "#059669",
        accentColor: "#34D399",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        fontFamily: "Inter",
        fontWeight: "400",
        borderRadius: 12,
        shadowIntensity: "medium",
        category: "community"
    },
    {
        name: "charity-event",
        displayName: "Charity Event",
        description: "Professional theme for fundraising events",
        primaryColor: "#14B8A6",
        secondaryColor: "#06B6D4",
        accentColor: "#0EA5E9",
        textColor: "#FFFFFF",
        backgroundGradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 50%, #0EA5E9 100%)",
        fontFamily: "Inter",
        fontWeight: "400",
        borderRadius: 8,
        shadowIntensity: "medium",
        category: "community"
    }
]

async function populateDefaultThemes() {
    console.log('🎨 Populating default event themes...')
    
    try {
        // First, check if themes already exist
        const existingThemesResponse = await fetch('/api/events/themes')
        if (existingThemesResponse.ok) {
            const existingData = await existingThemesResponse.json()
            if (existingData.themes && existingData.themes.length > 0) {
                console.log('✅ Themes already exist:', existingData.themes.length, 'themes found')
                return existingData.themes
            }
        }
        
        console.log('📝 No themes found, creating default themes...')
        
        // Note: This would require a POST endpoint for themes, which doesn't exist yet
        // For now, this is a reference for the theme structure
        console.log('📋 Default themes to be created:', defaultThemes)
        
        console.log('⚠️  To populate themes, you need to run SQL commands directly in your database:')
        
        defaultThemes.forEach((theme, index) => {
            const sql = `INSERT INTO event_themes (name, display_name, description, primary_color, secondary_color, accent_color, text_color, background_gradient, font_family, font_weight, border_radius, shadow_intensity, category) VALUES ('${theme.name}', '${theme.displayName}', '${theme.description}', '${theme.primaryColor}', '${theme.secondaryColor}', '${theme.accentColor}', '${theme.textColor}', '${theme.backgroundGradient}', '${theme.fontFamily}', '${theme.fontWeight}', ${theme.borderRadius}, '${theme.shadowIntensity}', '${theme.category}');`
            console.log(`Theme ${index + 1}:`, sql)
        })
        
    } catch (error) {
        console.error('❌ Error populating themes:', error)
    }
}

// Auto-run
populateDefaultThemes()

// Export for manual use
window.populateDefaultThemes = populateDefaultThemes
window.defaultThemes = defaultThemes
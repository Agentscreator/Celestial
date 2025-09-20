import { db } from "../src/db"
import { eventThemesTable } from "../src/db/schema"

const themes = [
  {
    name: "elegant-corporate",
    displayName: "Elegant Corporate",
    description: "Sophisticated design for executive meetings",
    primaryColor: "#374151",
    secondaryColor: "#6B7280",
    accentColor: "#9CA3AF",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #374151 0%, #1F2937 100%)",
    fontFamily: "Inter",
    fontWeight: "500",
    borderRadius: 12,
    shadowIntensity: "medium",
    category: "business",
  },
  {
    name: "modern-business",
    displayName: "Modern Business",
    description: "Clean and professional for corporate events",
    primaryColor: "#2563EB",
    secondaryColor: "#3B82F6",
    accentColor: "#6366F1",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    fontFamily: "Inter",
    fontWeight: "500",
    borderRadius: 8,
    shadowIntensity: "medium",
    category: "business",
  },
  {
    name: "minimal-tech",
    displayName: "Minimal Tech",
    description: "Sleek design for technology events",
    primaryColor: "#475569",
    secondaryColor: "#64748B",
    accentColor: "#94A3B8",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    fontFamily: "Inter",
    fontWeight: "400",
    borderRadius: 6,
    shadowIntensity: "low",
    category: "business",
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
    category: "party",
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
    fontWeight: "700",
    borderRadius: 20,
    shadowIntensity: "high",
    category: "party",
  },
  {
    name: "elegant-wedding",
    displayName: "Elegant Wedding",
    description: "Romantic design for special occasions",
    primaryColor: "#FB7185",
    secondaryColor: "#F9A8D4",
    accentColor: "#FBBF24",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #FB7185 0%, #F9A8D4 100%)",
    fontFamily: "Inter",
    fontWeight: "400",
    borderRadius: 24,
    shadowIntensity: "medium",
    category: "party",
  },
  {
    name: "festival-fun",
    displayName: "Festival Fun",
    description: "Vibrant theme for festivals and carnivals",
    primaryColor: "#FBBF24",
    secondaryColor: "#FB923C",
    accentColor: "#EF4444",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #FBBF24 0%, #FB923C 50%, #EF4444 100%)",
    fontFamily: "Inter",
    fontWeight: "600",
    borderRadius: 16,
    shadowIntensity: "high",
    category: "party",
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
    fontWeight: "500",
    borderRadius: 12,
    shadowIntensity: "medium",
    category: "community",
  },
  {
    name: "cozy-meetup",
    displayName: "Cozy Meetup",
    description: "Intimate setting for small gatherings",
    primaryColor: "#F59E0B",
    secondaryColor: "#D97706",
    accentColor: "#FBBF24",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    fontFamily: "Inter",
    fontWeight: "400",
    borderRadius: 16,
    shadowIntensity: "low",
    category: "community",
  },
  {
    name: "charity-event",
    displayName: "Charity Event",
    description: "Professional theme for fundraising events",
    primaryColor: "#14B8A6",
    secondaryColor: "#06B6D4",
    accentColor: "#0EA5E9",
    textColor: "#FFFFFF",
    backgroundGradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
    fontFamily: "Inter",
    fontWeight: "500",
    borderRadius: 8,
    shadowIntensity: "medium",
    category: "community",
  },
]

async function seedEventThemes() {
  try {
    console.log("🌱 Seeding event themes...")
    
    for (const theme of themes) {
      await db
        .insert(eventThemesTable)
        .values(theme)
        .onConflictDoNothing()
    }
    
    console.log("✅ Event themes seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding event themes:", error)
    throw error
  }
}

if (require.main === module) {
  seedEventThemes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedEventThemes }
import 'dotenv/config'
import { db } from '../src/db'
import { eventThemesTable, eventsTable } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function createEventThemes() {
  try {
    console.log('Creating event themes system...')
    
    // First, create the event_themes table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS event_themes (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          description TEXT,
          primary_color VARCHAR(7) NOT NULL,
          secondary_color VARCHAR(7) NOT NULL,
          accent_color VARCHAR(7) NOT NULL,
          text_color VARCHAR(7) NOT NULL,
          background_gradient TEXT,
          font_family VARCHAR(100) NOT NULL,
          font_weight VARCHAR(20) NOT NULL DEFAULT '400',
          border_radius INTEGER NOT NULL DEFAULT 8,
          shadow_intensity VARCHAR(20) NOT NULL DEFAULT 'medium',
          category VARCHAR(50) NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `)
      console.log('✓ Created event_themes table')
    } catch (error) {
      console.log('⚠ event_themes table may already exist:', error.message)
    }

    // Add theme columns to events table if they don't exist
    try {
      await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_id INTEGER REFERENCES event_themes(id)`)
      await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_flyer_url VARCHAR(500)`)
      await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_data TEXT`)
      console.log('✓ Added theme columns to events table')
    } catch (error) {
      console.log('⚠ Theme columns may already exist:', error.message)
    }

    // Insert default themes
    const defaultThemes = [
      // Business/Professional Themes
      {
        name: 'modern-business',
        displayName: 'Modern Business',
        description: 'Clean and professional for corporate events',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        accentColor: '#3b82f6',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        fontFamily: 'Inter',
        fontWeight: '500',
        borderRadius: 12,
        shadowIntensity: 'medium',
        category: 'business'
      },
      {
        name: 'elegant-corporate',
        displayName: 'Elegant Corporate',
        description: 'Sophisticated design for executive meetings',
        primaryColor: '#1f2937',
        secondaryColor: '#374151',
        accentColor: '#6b7280',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
        fontFamily: 'Roboto',
        fontWeight: '400',
        borderRadius: 8,
        shadowIntensity: 'high',
        category: 'business'
      },
      // Party/Celebration Themes
      {
        name: 'vibrant-party',
        displayName: 'Vibrant Party',
        description: 'Colorful and energetic for celebrations',
        primaryColor: '#ec4899',
        secondaryColor: '#be185d',
        accentColor: '#f472b6',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b6 100%)',
        fontFamily: 'Poppins',
        fontWeight: '600',
        borderRadius: 20,
        shadowIntensity: 'high',
        category: 'party'
      },
      {
        name: 'neon-glow',
        displayName: 'Neon Glow',
        description: 'Electric atmosphere for night events',
        primaryColor: '#a855f7',
        secondaryColor: '#7c3aed',
        accentColor: '#c084fc',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)',
        fontFamily: 'Orbitron',
        fontWeight: '700',
        borderRadius: 16,
        shadowIntensity: 'high',
        category: 'party'
      },
      // Sports/Fitness Themes
      {
        name: 'athletic-energy',
        displayName: 'Athletic Energy',
        description: 'Dynamic design for sports events',
        primaryColor: '#059669',
        secondaryColor: '#047857',
        accentColor: '#10b981',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
        fontFamily: 'Montserrat',
        fontWeight: '700',
        borderRadius: 12,
        shadowIntensity: 'medium',
        category: 'sports'
      },
      // Community/Social Themes
      {
        name: 'friendly-gather',
        displayName: 'Friendly Gather',
        description: 'Warm and welcoming for social events',
        primaryColor: '#06b6d4',
        secondaryColor: '#0891b2',
        accentColor: '#22d3ee',
        textColor: '#ffffff',
        backgroundGradient: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #22d3ee 100%)',
        fontFamily: 'Open Sans',
        fontWeight: '400',
        borderRadius: 16,
        shadowIntensity: 'medium',
        category: 'social'
      }
    ]

    // Check if themes already exist
    const existingThemes = await db.select().from(eventThemesTable).limit(1)
    
    if (existingThemes.length === 0) {
      await db.insert(eventThemesTable).values(defaultThemes)
      console.log('✓ Inserted default themes')
    } else {
      console.log('⚠ Themes already exist, skipping insertion')
    }
    
    // Check final count
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM event_themes`)
    console.log(`✓ Setup completed. Found ${result.rows[0].count} themes in database.`)
    
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

createEventThemes()
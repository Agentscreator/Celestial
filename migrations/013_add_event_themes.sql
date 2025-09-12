-- Add event themes and enhance events table with theme support
-- This migration adds the event themes system with visual customization

BEGIN;

-- Create event_themes table
CREATE TABLE IF NOT EXISTS event_themes (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    primary_color VARCHAR(7) NOT NULL, -- Hex color
    secondary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    background_gradient TEXT, -- CSS gradient string
    font_family VARCHAR(100) NOT NULL,
    font_weight VARCHAR(20) NOT NULL DEFAULT '400',
    border_radius INTEGER NOT NULL DEFAULT 8, -- px
    shadow_intensity VARCHAR(20) NOT NULL DEFAULT 'medium',
    category VARCHAR(50) NOT NULL, -- business, party, sports, etc.
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add theme columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS theme_id INTEGER REFERENCES event_themes(id),
ADD COLUMN IF NOT EXISTS custom_flyer_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS flyer_data TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_themes_category ON event_themes(category);
CREATE INDEX IF NOT EXISTS idx_event_themes_is_active ON event_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_events_theme_id ON events(theme_id);

-- Insert default themes
INSERT INTO event_themes (name, display_name, description, primary_color, secondary_color, accent_color, text_color, background_gradient, font_family, font_weight, border_radius, shadow_intensity, category) VALUES
-- Business/Professional Themes
('modern-business', 'Modern Business', 'Clean and professional for corporate events', '#2563eb', '#1e40af', '#3b82f6', '#ffffff', 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 'Inter', '500', 12, 'medium', 'business'),
('elegant-corporate', 'Elegant Corporate', 'Sophisticated design for executive meetings', '#1f2937', '#374151', '#6b7280', '#ffffff', 'linear-gradient(135deg, #111827 0%, #374151 100%)', 'Roboto', '400', 8, 'high', 'business'),
('minimalist-pro', 'Minimalist Pro', 'Clean and simple for professional gatherings', '#0f172a', '#334155', '#64748b', '#ffffff', 'linear-gradient(135deg, #020617 0%, #334155 100%)', 'Source Sans Pro', '400', 16, 'low', 'business'),

-- Party/Celebration Themes
('vibrant-party', 'Vibrant Party', 'Colorful and energetic for celebrations', '#ec4899', '#be185d', '#f472b6', '#ffffff', 'linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b6 100%)', 'Poppins', '600', 20, 'high', 'party'),
('neon-glow', 'Neon Glow', 'Electric atmosphere for night events', '#a855f7', '#7c3aed', '#c084fc', '#ffffff', 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)', 'Orbitron', '700', 16, 'high', 'party'),
('sunset-celebration', 'Sunset Celebration', 'Warm and inviting for evening parties', '#f59e0b', '#d97706', '#fbbf24', '#ffffff', 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)', 'Nunito', '600', 24, 'medium', 'party'),

-- Sports/Fitness Themes
('athletic-energy', 'Athletic Energy', 'Dynamic design for sports events', '#059669', '#047857', '#10b981', '#ffffff', 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)', 'Montserrat', '700', 12, 'medium', 'sports'),
('team-spirit', 'Team Spirit', 'Bold and motivating for team activities', '#dc2626', '#b91c1c', '#ef4444', '#ffffff', 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)', 'Oswald', '600', 8, 'high', 'sports'),
('outdoor-adventure', 'Outdoor Adventure', 'Natural feel for outdoor activities', '#16a34a', '#15803d', '#22c55e', '#ffffff', 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)', 'Roboto Condensed', '500', 16, 'medium', 'sports'),

-- Creative/Arts Themes
('artistic-flair', 'Artistic Flair', 'Creative and expressive for art events', '#8b5cf6', '#7c3aed', '#a78bfa', '#ffffff', 'linear-gradient(135deg, #581c87 0%, #8b5cf6 50%, #a78bfa 100%)', 'Playfair Display', '500', 20, 'high', 'creative'),
('bohemian-style', 'Bohemian Style', 'Free-spirited design for creative gatherings', '#f97316', '#ea580c', '#fb923c', '#ffffff', 'linear-gradient(135deg, #c2410c 0%, #f97316 50%, #fb923c 100%)', 'Crimson Text', '400', 24, 'medium', 'creative'),

-- Community/Social Themes
('friendly-gather', 'Friendly Gather', 'Warm and welcoming for social events', '#06b6d4', '#0891b2', '#22d3ee', '#ffffff', 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #22d3ee 100%)', 'Open Sans', '400', 16, 'medium', 'social'),
('community-connect', 'Community Connect', 'Inclusive design for community events', '#8b5cf6', '#7c3aed', '#a78bfa', '#ffffff', 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #a78bfa 100%)', 'Ubuntu', '500', 12, 'medium', 'social'),

-- Seasonal Themes
('summer-vibes', 'Summer Vibes', 'Bright and cheerful for summer events', '#fbbf24', '#f59e0b', '#fcd34d', '#1f2937', 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)', 'Raleway', '500', 20, 'medium', 'seasonal'),
('winter-elegance', 'Winter Elegance', 'Cool and sophisticated for winter events', '#475569', '#334155', '#64748b', '#ffffff', 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)', 'Lora', '400', 12, 'high', 'seasonal');

COMMIT;

-- Verify tables were created and data inserted
SELECT 'Event themes system created successfully' as status;

SELECT 
    name, 
    display_name, 
    category,
    CASE WHEN name IS NOT NULL THEN '✓ CREATED' ELSE '✗ MISSING' END as status
FROM event_themes 
ORDER BY category, name;
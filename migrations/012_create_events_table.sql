-- Create events table with community support
-- This migration adds the events table with community invitation functionality

BEGIN;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(300) NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(10) NOT NULL, -- Format: "HH:MM"
    max_participants INTEGER, -- null = unlimited
    current_participants INTEGER NOT NULL DEFAULT 1, -- Creator is first participant
    created_by UUID NOT NULL REFERENCES users(id),
    share_token VARCHAR(64) UNIQUE NOT NULL, -- For sharing events via link
    is_active INTEGER NOT NULL DEFAULT 1, -- 0 = cancelled, 1 = active
    -- Community invitation fields
    is_invite INTEGER NOT NULL DEFAULT 0, -- 0 = no community, 1 = has community
    invite_description TEXT, -- What the user is inviting people to do
    group_name VARCHAR(100), -- Name for auto-created community
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_share_token ON events(share_token);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Create unique constraint to prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique ON event_participants(event_id, user_id);

COMMIT;

-- Verify tables were created
SELECT 'Events tables created successfully' as status;

SELECT table_name, 
       CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM (VALUES 
    ('events'),
    ('event_participants')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public'
ORDER BY expected_tables.table_name;
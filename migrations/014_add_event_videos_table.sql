-- Migration: Add event_videos table for video uploads to events
-- Created: 2025-01-09

CREATE TABLE IF NOT EXISTS event_videos (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  title VARCHAR(200),
  description TEXT,
  duration INTEGER, -- Video duration in seconds
  file_size INTEGER, -- File size in bytes
  mime_type VARCHAR(100) NOT NULL DEFAULT 'video/mp4',
  is_public INTEGER NOT NULL DEFAULT 1, -- 0 = private to event participants, 1 = public
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_videos_event_id ON event_videos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_videos_uploaded_by ON event_videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_videos_uploaded_at ON event_videos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_videos_is_public ON event_videos(is_public);
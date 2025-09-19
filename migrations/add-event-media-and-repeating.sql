-- Add custom background and repeating event fields to events table
ALTER TABLE events 
ADD COLUMN custom_background_url VARCHAR(500),
ADD COLUMN custom_background_type VARCHAR(20),
ADD COLUMN is_repeating INTEGER NOT NULL DEFAULT 0,
ADD COLUMN repeat_pattern VARCHAR(20),
ADD COLUMN repeat_interval INTEGER DEFAULT 1,
ADD COLUMN repeat_end_date DATE,
ADD COLUMN repeat_days_of_week VARCHAR(20),
ADD COLUMN parent_event_id INTEGER REFERENCES events(id);

-- Rename event_videos table to event_media and add new fields
ALTER TABLE event_videos RENAME TO event_media;
ALTER TABLE event_media RENAME COLUMN video_url TO media_url;
ALTER TABLE event_media ADD COLUMN media_type VARCHAR(20) NOT NULL DEFAULT 'video';
ALTER TABLE event_media ADD COLUMN width INTEGER;
ALTER TABLE event_media ADD COLUMN height INTEGER;

-- Update existing records to have media_type = 'video'
UPDATE event_media SET media_type = 'video' WHERE media_type IS NULL OR media_type = '';

-- Add comments for documentation
COMMENT ON COLUMN events.custom_background_url IS 'Custom uploaded background image or gif URL';
COMMENT ON COLUMN events.custom_background_type IS 'Type of custom background: image or gif';
COMMENT ON COLUMN events.is_repeating IS '0 = one-time event, 1 = repeating event';
COMMENT ON COLUMN events.repeat_pattern IS 'Repeat pattern: daily, weekly, monthly, yearly';
COMMENT ON COLUMN events.repeat_interval IS 'Repeat every X intervals (e.g., every 2 weeks)';
COMMENT ON COLUMN events.repeat_end_date IS 'When to stop repeating (null = indefinite)';
COMMENT ON COLUMN events.repeat_days_of_week IS 'Days of week for weekly repeats (e.g., 1,3,5 for Mon,Wed,Fri)';
COMMENT ON COLUMN events.parent_event_id IS 'Links to original event if this is a repeat instance';
COMMENT ON COLUMN event_media.media_type IS 'Type of media: image, video, or gif';
COMMENT ON COLUMN event_media.width IS 'Media width in pixels';
COMMENT ON COLUMN event_media.height IS 'Media height in pixels';
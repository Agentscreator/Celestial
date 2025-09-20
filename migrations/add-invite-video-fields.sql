-- Add invite video fields to events table
ALTER TABLE events 
ADD COLUMN invite_video_url VARCHAR(500),
ADD COLUMN invite_video_thumbnail VARCHAR(500),
ADD COLUMN invite_video_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN events.invite_video_url IS 'URL of the invite video (max 99 seconds)';
COMMENT ON COLUMN events.invite_video_thumbnail IS 'Thumbnail of the invite video';
COMMENT ON COLUMN events.invite_video_description IS 'Description for the invite video';
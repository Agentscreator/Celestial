-- Add video thumbnail fields to events table
ALTER TABLE events 
ADD COLUMN thumbnail_video_url VARCHAR(500),
ADD COLUMN thumbnail_image_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN events.thumbnail_video_url IS 'URL of the video to use as event thumbnail for sharing';
COMMENT ON COLUMN events.thumbnail_image_url IS 'Generated thumbnail image from the video for sharing';
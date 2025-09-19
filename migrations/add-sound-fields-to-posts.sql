-- Add sound/music fields to posts table
ALTER TABLE posts 
ADD COLUMN sound_id VARCHAR(100),
ADD COLUMN sound_name VARCHAR(200),
ADD COLUMN sound_artist VARCHAR(200),
ADD COLUMN sound_preview_url VARCHAR(500),
ADD COLUMN sound_spotify_url VARCHAR(500);

-- Add comments for documentation
COMMENT ON COLUMN posts.sound_id IS 'Spotify track ID';
COMMENT ON COLUMN posts.sound_name IS 'Track name';
COMMENT ON COLUMN posts.sound_artist IS 'Artist name(s)';
COMMENT ON COLUMN posts.sound_preview_url IS 'Spotify preview URL';
COMMENT ON COLUMN posts.sound_spotify_url IS 'Full Spotify track URL';
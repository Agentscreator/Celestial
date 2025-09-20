-- Create post_shares table for sharing functionality
CREATE TABLE IF NOT EXISTS post_shares (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  share_token VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_shares_token ON post_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);
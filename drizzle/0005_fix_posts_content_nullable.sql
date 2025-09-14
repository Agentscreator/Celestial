-- Make posts content nullable to allow media-only posts
ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;
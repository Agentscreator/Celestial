-- Fix posts table to allow nullable content for media-only posts
ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;
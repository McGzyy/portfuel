-- Store original X post URL when admin curates a call from social (hidden in UI v1).
ALTER TABLE calls ADD COLUMN IF NOT EXISTS source_tweet_url text;

COMMENT ON COLUMN calls.source_tweet_url IS 'Original X/Twitter post URL for admin-curated calls; not displayed in UI v1';

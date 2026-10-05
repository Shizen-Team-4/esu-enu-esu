ALTER TABLE stories ADD COLUMN expires_at integer NOT NULL DEFAULT 0;
UPDATE stories SET expires_at = created_at + 86400000;
CREATE INDEX stories_expiry_idx ON stories(expires_at);
CREATE TABLE story_likes (
	story_id text NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	created_at integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
	PRIMARY KEY (story_id, user_id)
);

ALTER TABLE `posts` ADD `repost_of_id` text REFERENCES posts(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `posts_repost_idx` ON `posts` (`repost_of_id`);

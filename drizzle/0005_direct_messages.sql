CREATE TABLE `direct_messages` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`thread_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `direct_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_messages_id_unique` ON `direct_messages` (`id`);--> statement-breakpoint
CREATE INDEX `direct_messages_thread_idx` ON `direct_messages` (`thread_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `direct_messages_sender_idx` ON `direct_messages` (`sender_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `direct_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`first_user_id` text NOT NULL,
	`second_user_id` text NOT NULL,
	`created_by` text NOT NULL,
	`first_read_sequence` integer DEFAULT 0 NOT NULL,
	`second_read_sequence` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`first_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`second_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `direct_threads_pair_idx` ON `direct_threads` (`first_user_id`,`second_user_id`);--> statement-breakpoint
CREATE INDEX `direct_threads_first_idx` ON `direct_threads` (`first_user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `direct_threads_second_idx` ON `direct_threads` (`second_user_id`,`updated_at`);
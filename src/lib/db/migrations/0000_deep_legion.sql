CREATE TABLE `scan_cache` (
	`normalized_url` text PRIMARY KEY NOT NULL,
	`last_scan_id` text,
	`vulnerable` integer,
	`confidence` text,
	`cached_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`last_scan_id`) REFERENCES `scans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`status` text DEFAULT 'pending',
	`vulnerable` integer,
	`confidence` text,
	`uses_rsc` integer,
	`framework` text,
	`detected_version` text,
	`http_status` integer,
	`error_signature` text,
	`raw_response` text,
	`authorization_confirmed` integer DEFAULT false,
	`scan_duration_ms` integer,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`plan` text DEFAULT 'free',
	`scans_today` integer DEFAULT 0,
	`scans_reset_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
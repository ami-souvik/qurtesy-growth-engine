CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_providerAccountId_idx` ON `account` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE TABLE `content_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`topic` text,
	`audience` text,
	`problem` text,
	`source` text,
	`source_url` text,
	`priority` integer DEFAULT 0,
	`status` text DEFAULT 'IDEA' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`content_idea_id` text,
	`core_message` text,
	`audience` text,
	`problem` text,
	`insight` text,
	`evidence` text,
	`opinion` text,
	`cta` text,
	`content_type` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`content_idea_id`) REFERENCES `content_ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `data_source_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`product_updates` text,
	`seo_data` text,
	`experiments` text,
	`user_pain_points` text,
	`job_trends` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hypothesis` text,
	`content_type` text,
	`platform` text,
	`audience` text,
	`angle` text,
	`cta` text,
	`start_date` integer,
	`end_date` integer,
	`status` text DEFAULT 'ACTIVE',
	`result_summary` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `growth_intelligence` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `data_source_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`platform_draft_id` text,
	`recorded_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`impressions` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`comments` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`bookmarks` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`website_visits` integer DEFAULT 0,
	`builder_starts` integer DEFAULT 0,
	`job_analyses` integer DEFAULT 0,
	`tailored_resumes` integer DEFAULT 0,
	`cover_letters` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`platform_draft_id`) REFERENCES `platform_drafts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `platform_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text,
	`platform` text NOT NULL,
	`draft` text NOT NULL,
	`hook` text,
	`cta` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`human_notes` text,
	`promotion_risk` text,
	`approved_at` integer,
	`published_at` integer,
	`published_url` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reddit_communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reddit_communities_name_unique` ON `reddit_communities` (`name`);--> statement-breakpoint
CREATE TABLE `reddit_config` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`last_scan_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reddit_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`reddit_post_id` text NOT NULL,
	`subreddit` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`permalink` text NOT NULL,
	`author` text,
	`score` integer DEFAULT 0,
	`comment_count` integer DEFAULT 0,
	`created_utc` integer NOT NULL,
	`fetched_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_nsfw` integer DEFAULT false,
	`is_spam` integer DEFAULT false,
	`is_deleted` integer DEFAULT false,
	`ingestion_status` text DEFAULT 'UNPROCESSED' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reddit_posts_reddit_post_id_unique` ON `reddit_posts` (`reddit_post_id`);--> statement-breakpoint
CREATE TABLE `reddit_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` integer,
	`subreddits_scanned` integer DEFAULT 0,
	`posts_discovered` integer DEFAULT 0,
	`new_posts` integer DEFAULT 0,
	`skipped_posts` integer DEFAULT 0,
	`status` text NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `research_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`content_idea_id` text,
	`url` text,
	`title` text,
	`source_type` text,
	`publisher` text,
	`summary` text,
	`key_points` text,
	`credibility` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`content_idea_id`) REFERENCES `content_ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identifier_token_idx` ON `verificationToken` (`identifier`,`token`);
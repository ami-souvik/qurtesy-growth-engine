import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_scans\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`started_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`completed_at\` integer,
      \`subreddits_scanned\` integer DEFAULT 0,
      \`posts_discovered\` integer DEFAULT 0,
      \`new_posts\` integer DEFAULT 0,
      \`skipped_posts\` integer DEFAULT 0,
      \`status\` text NOT NULL,
      \`error_message\` text
    );
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_posts\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`reddit_post_id\` text NOT NULL,
      \`subreddit\` text NOT NULL,
      \`title\` text NOT NULL,
      \`body\` text,
      \`permalink\` text NOT NULL,
      \`author\` text,
      \`score\` integer DEFAULT 0,
      \`comment_count\` integer DEFAULT 0,
      \`created_utc\` integer NOT NULL,
      \`fetched_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`is_nsfw\` integer DEFAULT false,
      \`is_spam\` integer DEFAULT false,
      \`is_deleted\` integer DEFAULT false,
      \`ingestion_status\` text DEFAULT 'UNPROCESSED' NOT NULL
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`reddit_posts_reddit_post_id_unique\` ON \`reddit_posts\` (\`reddit_post_id\`);`)
  console.log("Done migrating Phase 2 schemas")
}

run().catch(console.error)

import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 9 migration: creating reddit_manual_drafts table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_manual_drafts\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`draft_type\` text NOT NULL,
      \`subreddit\` text NOT NULL,
      \`post_title\` text NOT NULL,
      \`post_url\` text,
      \`post_body\` text,
      \`attached_images\` text,
      \`target_comment_author\` text,
      \`target_comment_body\` text,
      \`strategy\` text NOT NULL,
      \`ai_draft\` text NOT NULL,
      \`human_edited_draft\` text,
      \`value_provided_summary\` text,
      \`include_product_mention\` integer DEFAULT 0 NOT NULL,
      \`product_mention_reason\` text,
      \`status\` text DEFAULT 'DRAFTED' NOT NULL,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_manual_drafts_type_idx\` ON \`reddit_manual_drafts\` (\`draft_type\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_manual_drafts_created_idx\` ON \`reddit_manual_drafts\` (\`created_at\`);`)

  console.log("Done migrating Phase 9 reddit_manual_drafts.")
}

run().catch(console.error)

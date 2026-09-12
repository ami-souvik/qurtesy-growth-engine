import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 7 migration: creating reddit_posted_comments table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_posted_comments\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`opportunity_id\` text REFERENCES \`reddit_opportunities\`(\`id\`) ON DELETE SET NULL,
      \`comment_draft_id\` text REFERENCES \`reddit_comment_drafts\`(\`id\`) ON DELETE SET NULL,
      \`resume_review_id\` text REFERENCES \`reddit_resume_reviews\`(\`id\`) ON DELETE SET NULL,
      \`subreddit\` text NOT NULL,
      \`post_title\` text NOT NULL,
      \`post_url\` text NOT NULL,
      \`posted_url\` text NOT NULL,
      \`posted_at\` integer NOT NULL,
      \`strategy\` text NOT NULL,
      \`response_style\` text,
      \`topic\` text,
      \`notes\` text,
      \`ai_draft\` text,
      \`human_edited_draft\` text,
      \`final_posted_comment\` text NOT NULL,
      \`upvotes\` integer DEFAULT 0 NOT NULL,
      \`replies\` integer DEFAULT 0 NOT NULL,
      \`profile_visits\` integer DEFAULT 0 NOT NULL,
      \`qurtesy_clicks\` integer DEFAULT 0 NOT NULL,
      \`qurtesy_sessions\` integer DEFAULT 0 NOT NULL,
      \`builder_starts\` integer DEFAULT 0 NOT NULL,
      \`tailoring_starts\` integer DEFAULT 0 NOT NULL,
      \`other_product_actions\` integer DEFAULT 0 NOT NULL,
      \`last_metrics_updated_at\` integer,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posted_opp_idx\` ON \`reddit_posted_comments\` (\`opportunity_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posted_sub_idx\` ON \`reddit_posted_comments\` (\`subreddit\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posted_strat_idx\` ON \`reddit_posted_comments\` (\`strategy\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posted_time_idx\` ON \`reddit_posted_comments\` (\`posted_at\`);`)

  console.log("Done migrating Phase 7 schemas: reddit_posted_comments created.")
}

run().catch(console.error)

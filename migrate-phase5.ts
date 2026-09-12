import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 5 migration: creating reddit_comment_drafts table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_comment_drafts\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`opportunity_id\` text NOT NULL REFERENCES \`reddit_opportunities\`(\`id\`) ON DELETE CASCADE,
      \`strategy\` text NOT NULL,
      \`include_product_mention\` integer DEFAULT 0 NOT NULL,
      \`product_mention_reason\` text NOT NULL,
      \`original_ai_draft\` text NOT NULL,
      \`human_edited_draft\` text,
      \`final_approved_draft\` text,
      \`status\` text DEFAULT 'DRAFTED' NOT NULL,
      \`model_used\` text,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_comment_drafts_opp_idx\` ON \`reddit_comment_drafts\` (\`opportunity_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_comment_drafts_status_idx\` ON \`reddit_comment_drafts\` (\`status\`);`)

  console.log("Done migrating Phase 5 schemas: reddit_comment_drafts created.")
}

run().catch(console.error)

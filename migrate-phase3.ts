import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 3 migration: creating reddit_opportunities table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_opportunities\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`post_id\` text NOT NULL REFERENCES \`reddit_posts\`(\`id\`) ON DELETE CASCADE,
      \`opportunity_type\` text NOT NULL,
      \`priority\` text NOT NULL,
      \`opportunity_score\` integer NOT NULL,
      \`pain_score\` integer DEFAULT 0 NOT NULL,
      \`intent_score\` integer DEFAULT 0 NOT NULL,
      \`relevance_score\` integer DEFAULT 0 NOT NULL,
      \`helpfulness_score\` integer DEFAULT 0 NOT NULL,
      \`freshness_score\` integer DEFAULT 0 NOT NULL,
      \`promotional_risk\` text DEFAULT 'LOW' NOT NULL,
      \`confidence\` integer DEFAULT 0 NOT NULL,
      \`recommended_angle\` text NOT NULL,
      \`reasoning\` text,
      \`risk_flags\` text,
      \`status\` text DEFAULT 'DISCOVERED' NOT NULL,
      \`analysis_version\` text DEFAULT 'v1.0' NOT NULL,
      \`model_used\` text,
      \`analyzed_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_opportunities_post_id_idx\` ON \`reddit_opportunities\` (\`post_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_opportunities_priority_idx\` ON \`reddit_opportunities\` (\`priority\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_opportunities_score_idx\` ON \`reddit_opportunities\` (\`opportunity_score\`);`)

  console.log("Done migrating Phase 3 schemas: reddit_opportunities created.")
}

run().catch(console.error)

import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 4 migration: creating reddit_growth_insights table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_growth_insights\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`growth_intelligence_id\` text REFERENCES \`growth_intelligence\`(\`id\`) ON DELETE CASCADE,
      \`theme\` text NOT NULL,
      \`category\` text NOT NULL,
      \`evidence_status\` text NOT NULL,
      \`frequency\` integer DEFAULT 1 NOT NULL,
      \`confidence\` integer DEFAULT 0 NOT NULL,
      \`natural_language\` text NOT NULL,
      \`recommended_action\` text NOT NULL,
      \`last_observed_at\` integer NOT NULL,
      \`sources\` text NOT NULL,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_growth_insights_growth_intel_idx\` ON \`reddit_growth_insights\` (\`growth_intelligence_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_growth_insights_category_idx\` ON \`reddit_growth_insights\` (\`category\`);`)

  console.log("Done migrating Phase 4 schemas: reddit_growth_insights created.")
}

run().catch(console.error)

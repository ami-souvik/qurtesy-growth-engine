import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 6 migration: creating reddit_resume_reviews table...")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`reddit_resume_reviews\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`opportunity_id\` text NOT NULL REFERENCES \`reddit_opportunities\`(\`id\`) ON DELETE CASCADE,
      \`target_role\` text,
      \`target_job_description\` text,
      \`extracted_resume_snippet\` text,
      \`top_improvements\` text NOT NULL,
      \`bullet_rewrites\` text NOT NULL,
      \`missing_evidence\` text NOT NULL,
      \`ats_considerations\` text NOT NULL,
      \`clarity_assessment\` text NOT NULL,
      \`keyword_alignment\` text,
      \`comment_draft\` text NOT NULL,
      \`status\` text DEFAULT 'ANALYZED' NOT NULL,
      \`model_used\` text,
      \`created_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
      \`updated_at\` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_resume_reviews_opp_idx\` ON \`reddit_resume_reviews\` (\`opportunity_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_resume_reviews_status_idx\` ON \`reddit_resume_reviews\` (\`status\`);`)

  console.log("Done migrating Phase 6 schemas: reddit_resume_reviews created.")
}

run().catch(console.error)

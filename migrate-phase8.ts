import { db } from "./src/lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Running Phase 8 migration: adding performance indexes for query optimization...")

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posts_status_idx\` ON \`reddit_posts\` (\`ingestion_status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_posts_created_utc_idx\` ON \`reddit_posts\` (\`created_utc\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`reddit_opportunities_status_idx\` ON \`reddit_opportunities\` (\`status\`);`)

  console.log("Done migrating Phase 8 performance indexes.")
}

run().catch(console.error)

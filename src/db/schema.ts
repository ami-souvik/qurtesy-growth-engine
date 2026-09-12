import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { AdapterAccountType } from "next-auth/adapters"

// NextAuth Tables
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    providerProviderAccountIdIndex: uniqueIndex("provider_providerAccountId_idx").on(account.provider, account.providerAccountId),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    identifierTokenIndex: uniqueIndex("identifier_token_idx").on(vt.identifier, vt.token),
  })
);

// App Domain Tables
export const contentIdeas = sqliteTable("content_ideas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  topic: text("topic"),
  audience: text("audience"),
  problem: text("problem"),
  source: text("source"),
  sourceUrl: text("source_url"),
  priority: integer("priority").default(0), // Can be opportunity score
  status: text("status").default("IDEA").notNull(), // IDEA, RESEARCHING, READY_FOR_GENERATION, etc.
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const researchSources = sqliteTable("research_sources", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentIdeaId: text("content_idea_id").references(() => contentIdeas.id, { onDelete: 'cascade' }),
  url: text("url"),
  title: text("title"),
  sourceType: text("source_type"), // Primary, Secondary, Community, Unknown
  publisher: text("publisher"),
  summary: text("summary"),
  keyPoints: text("key_points"),
  credibility: text("credibility"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentIdeaId: text("content_idea_id").references(() => contentIdeas.id, { onDelete: 'cascade' }),
  coreMessage: text("core_message"),
  audience: text("audience"),
  problem: text("problem"),
  insight: text("insight"),
  evidence: text("evidence"),
  opinion: text("opinion"),
  cta: text("cta"),
  contentType: text("content_type"),
  status: text("status").default("DRAFT").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const platformDrafts = sqliteTable("platform_drafts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentItemId: text("content_item_id").references(() => contentItems.id, { onDelete: 'cascade' }),
  platform: text("platform").notNull(), // reddit, x, linkedin, blog
  draft: text("draft").notNull(),
  hook: text("hook"),
  cta: text("cta"),
  status: text("status").default("DRAFT").notNull(), // DRAFT, NEEDS_REVIEW, APPROVED, PUBLISHED, ARCHIVED
  humanNotes: text("human_notes"),
  promotionRisk: text("promotion_risk"), // Low, Medium, High (esp for reddit)
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  publishedUrl: text("published_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const experiments = sqliteTable("experiments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  contentType: text("content_type"),
  platform: text("platform"),
  audience: text("audience"),
  angle: text("angle"),
  cta: text("cta"),
  startDate: integer("start_date", { mode: "timestamp_ms" }),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  status: text("status").default("ACTIVE"),
  resultSummary: text("result_summary"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const performanceMetrics = sqliteTable("performance_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  platformDraftId: text("platform_draft_id").references(() => platformDrafts.id, { onDelete: 'cascade' }),
  recordedAt: integer("recorded_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  
  // Vanity metrics
  impressions: integer("impressions").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  bookmarks: integer("bookmarks").default(0),
  clicks: integer("clicks").default(0),

  // Meaningful growth metrics
  websiteVisits: integer("website_visits").default(0),
  builderStarts: integer("builder_starts").default(0),
  jobAnalyses: integer("job_analyses").default(0),
  tailoredResumes: integer("tailored_resumes").default(0),
  coverLetters: integer("cover_letters").default(0),

  notes: text("notes"),
});

export const dataSourceSnapshots = sqliteTable("data_source_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productUpdates: text("product_updates"),
  seoData: text("seo_data"),
  experiments: text("experiments"),
  userPainPoints: text("user_pain_points"),
  jobTrends: text("job_trends"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const growthIntelligence = sqliteTable("growth_intelligence", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => dataSourceSnapshots.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const redditConfig = sqliteTable("reddit_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
  lastScanAt: integer("last_scan_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const redditCommunities = sqliteTable("reddit_communities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const redditScans = sqliteTable("reddit_scans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  subredditsScanned: integer("subreddits_scanned").default(0),
  postsDiscovered: integer("posts_discovered").default(0),
  newPosts: integer("new_posts").default(0),
  skippedPosts: integer("skipped_posts").default(0),
  status: text("status").notNull(), // SUCCESS, FAILED
  errorMessage: text("error_message"),
});

export const redditPosts = sqliteTable("reddit_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  redditPostId: text("reddit_post_id").notNull().unique(), // The ID from Reddit e.g. "t3_xxxxxx"
  subreddit: text("subreddit").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  permalink: text("permalink").notNull(),
  author: text("author"),
  score: integer("score"),
  commentCount: integer("comment_count"),
  createdUtc: integer("created_utc", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  
  // Filtering & Safety flags
  isNsfw: integer("is_nsfw", { mode: "boolean" }).default(false),
  isSpam: integer("is_spam", { mode: "boolean" }).default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  
  ingestionStatus: text("ingestion_status").default("UNPROCESSED").notNull(), // UNPROCESSED, FILTERED, OPPORTUNITY
});

export const redditOpportunities = sqliteTable("reddit_opportunities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => redditPosts.id, { onDelete: "cascade" }),
  
  // Classification & Scoring
  opportunityType: text("opportunity_type").notNull(), // PAIN, GIVEAWAY, RESUME_REVIEW, ANTI_FAKE_AI, IGNORE
  priority: text("priority").notNull(), // HIGH, MEDIUM, LOW, IGNORE
  opportunityScore: integer("opportunity_score").notNull(), // 0 - 100
  
  // Detailed Sub-scores (0 - 10)
  painScore: integer("pain_score").default(0).notNull(),
  intentScore: integer("intent_score").default(0).notNull(),
  relevanceScore: integer("relevance_score").default(0).notNull(),
  helpfulnessScore: integer("helpfulness_score").default(0).notNull(),
  freshnessScore: integer("freshness_score").default(0).notNull(),
  
  // Risk & Confidence
  promotionalRisk: text("promotional_risk").default("LOW").notNull(), // LOW, MEDIUM, HIGH
  confidence: integer("confidence").default(0).notNull(), // 0 - 100 percentage
  
  // Strategic Insights
  recommendedAngle: text("recommended_angle").notNull(),
  reasoning: text("reasoning"),
  riskFlags: text("risk_flags"), // JSON string e.g. '["HIGH_PROMOTION_RISK"]'
  
  // Workflow State & Provenance
  status: text("status").default("DISCOVERED").notNull(), // DISCOVERED, SAVED, DISMISSED
  analysisVersion: text("analysis_version").default("v1.0").notNull(),
  modelUsed: text("model_used"),
  
  analyzedAt: integer("analyzed_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});


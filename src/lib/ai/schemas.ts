import { z } from "zod";

export const ContentIdeaSchema = z.object({
  title: z.string(),
  audience: z.string(),
  problem: z.string(),
  angle: z.string(),
  evidence: z.array(z.string()),
  suggestedPlatforms: z.array(z.string()),
  suggestedCTA: z.string(),
});

export const ContentIdeasResponseSchema = z.object({
  ideas: z.array(ContentIdeaSchema),
});

export const CoreContentSchema = z.object({
  audience: z.string(),
  problem: z.string(),
  insight: z.string(),
  evidence: z.string(),
  opinion: z.string(),
  cta: z.string(),
});

"use client"

import * as React from "react"
import {
  Flame,
  ExternalLink,
  Copy,
  Check,
  FileSearch,
  Eye,
  FileText,
  TrendingUp,
  Sparkles,
  Layers,
} from "lucide-react"
import { roastResumeFromRedditAction } from "@/actions/roast-resume-actions"
import { RoastDiagnosis, RedditResumeDetails, RoastSeverity } from "@/lib/types/roast-types"
import { Button } from "@/components/common/Button"
import { Typography } from "@/components/common/Typography"
import {
  PrivacyShieldPill,
  MetricSquircle,
  InspectionPullout,
} from "@/components/common/SignatureComponents"
import { Table, TableHeader, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/common/Table"

const SAMPLE_POSTS = [
  {
    label: "Strategy Analyst (4 YoE)",
    url: "https://www.reddit.com/r/resumes/comments/1wr3z99/4_yoe_commercial_strategy_pricing_analyst_senior/",
  },
  {
    label: "Marketing Recent Grad",
    url: "https://www.reddit.com/r/resumes/comments/1wr2ql7/0_years_recent_graduate_brand_marketing/",
  },
  {
    label: "Help Desk & Cybersecurity",
    url: "https://www.reddit.com/r/resumes/comments/1wr1ree/0_yoe_it_help_desk_cybersecurity_grciam_united/",
  },
]

export function RoastResumeClient() {
  const [redditUrl, setRedditUrl] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const [stageMessage, setStageMessage] = React.useState<string>("")
  const [error, setError] = React.useState<string | null>(null)

  const [diagnosis, setDiagnosis] = React.useState<RoastDiagnosis | null>(null)
  const [redditDetails, setRedditDetails] = React.useState<RedditResumeDetails | null>(null)
  const [selectedDocUrl, setSelectedDocUrl] = React.useState<string | null>(null)

  // Copy helper
  const [copiedBulletIndex, setCopiedBulletIndex] = React.useState<number | null>(null)
  const [copiedSummary, setCopiedSummary] = React.useState(false)

  const handleRoast = (overrideUrl?: string, docUrl?: string) => {
    const targetUrl = (overrideUrl || redditUrl).trim()
    if (!targetUrl) {
      setError("Please paste a Reddit post URL.")
      return
    }

    setError(null)
    setStageMessage("Connecting to Reddit post...")

    startTransition(async () => {
      try {
        setStageMessage("Downloading resume document from Reddit CDN...")
        const result = await roastResumeFromRedditAction(targetUrl, docUrl)

        if (!result.success || !result.diagnosis) {
          setError(result.error || "Failed to roast resume. Please verify the Reddit post link.")
          setStageMessage("")
          return
        }

        setDiagnosis(result.diagnosis)
        setRedditDetails(result.redditDetails || null)
        setSelectedDocUrl(docUrl || result.redditDetails?.primaryDocumentUrl || null)
        setStageMessage("")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred."
        setError(msg)
        setStageMessage("")
      }
    })
  }

  const handleCopyRewrite = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBulletIndex(index)
      setTimeout(() => setCopiedBulletIndex(null), 2500)
    } catch {
      // ignore
    }
  }

  const handleCopySummary = async () => {
    if (!diagnosis) return
    const text = `Qurtesy Resume Roast:\n\nHeadline: ${diagnosis.roastHeadline}\n\nTop Observations:\n${diagnosis.executiveDiagnosis.map((d) => `• ${d}`).join("\n")}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2500)
    } catch {
      // ignore
    }
  }

  const getSeverityTone = (severity: RoastSeverity): "error" | "warning" | "info" => {
    switch (severity) {
      case "CRITICAL":
      case "HIGH":
        return "error"
      case "MEDIUM":
        return "warning"
      default:
        return "info"
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* Editorial Header Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PrivacyShieldPill
            label="Client-Side Evaluator"
            sublabel="Zero Document Retention"
          />
          <span className="font-mono text-xs text-muted">
            Engine: Gemini Multimodal · Port 3000
          </span>
        </div>

        <div className="space-y-2">
          <Typography as="h1" variant="heading-1">
            Roast My Resume.
          </Typography>
          <Typography variant="body-sm">
            High-voltage diagnostic intelligence. Paste any public Reddit resume link to extract the document, expose ATS traps, and perform bullet surgery.
          </Typography>
        </div>
      </div>

      {/* Input Action Surface */}
      <div className="p-6 md:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-muted">
          <FileSearch className="h-4 w-4 text-accent" />
          <span>Reddit Document Ingestion</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleRoast()
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="url"
              value={redditUrl}
              onChange={(e) => setRedditUrl(e.target.value)}
              placeholder="https://www.reddit.com/r/resumes/comments/..."
              className="w-full input-surface font-mono text-sm h-12"
              disabled={isPending}
            />
            {redditUrl && (
              <button
                type="button"
                onClick={() => setRedditUrl("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground font-mono transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isPending || !redditUrl.trim()}
            loading={isPending}
            icon={!isPending ? <Flame className="h-4 w-4 text-accent" /> : undefined}
            className="h-12 shrink-0 px-8"
          >
            {isPending ? "Roasting..." : "Roast Resume"}
          </Button>
        </form>

        {/* Quick Sample Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-muted">Active r/resumes samples:</span>
          {SAMPLE_POSTS.map((sample) => (
            <Button
              key={sample.label}
              variant="utility"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setRedditUrl(sample.url)
                handleRoast(sample.url)
              }}
            >
              {sample.label}
            </Button>
          ))}
        </div>

        {/* Live Ingestion Progress Indicator */}
        {isPending && (
          <div className="p-4 rounded-xl border border-accent/30 bg-surface/80 flex items-center gap-3 animate-pulse">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {stageMessage || "Analyzing resume document..."}
              </p>
              <p className="text-[11px] font-mono text-muted">
                Executing multi-page base64 decoding & deterministic evidence modeling.
              </p>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <InspectionPullout variant="error" title="Diagnostics Failed">
            {error}
          </InspectionPullout>
        )}
      </div>

      {/* Results View - Strict Anti-Nesting Editorial Layout */}
      {diagnosis && (
        <div className="space-y-12 pt-4">
          {/* Main Verdict Anchor */}
          <div className="p-8 md:p-10 rounded-3xl bg-surface border border-border shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-bold uppercase tracking-wider border border-accent/30">
                    <Sparkles className="h-3 w-3 text-accent" />
                    Roast Verdict
                  </span>
                  {diagnosis.evidence?.detectedRole && (
                    <span className="font-mono text-xs text-muted px-2.5 py-0.5 rounded-full border border-border bg-background">
                      Role: {diagnosis.evidence.detectedRole}
                    </span>
                  )}
                </div>

                <Typography as="h2" variant="heading-2" className="leading-tight">
                  &ldquo;{diagnosis.roastHeadline}&rdquo;
                </Typography>
              </div>

              <div className="shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopySummary}
                  icon={copiedSummary ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copiedSummary ? "Copied Verdict" : "Copy Verdict"}
                </Button>
              </div>
            </div>

            {/* Reddit Submission Source Bar */}
            {redditDetails && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60 text-xs text-muted">
                <span className="font-semibold text-foreground">
                  r/{redditDetails.subreddit}
                </span>
                {redditDetails.author && <span>· by u/{redditDetails.author}</span>}
                <span className="text-muted/40">•</span>
                <span className="line-clamp-1 max-w-md font-mono">{redditDetails.title}</span>
                <a
                  href={redditDetails.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-foreground hover:text-accent font-medium transition-colors"
                >
                  View on Reddit <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Dual Column Layout: Document Canvas & Diagnostic Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Document Preview Canvas & Evidence Metrics (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-muted">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <FileText className="h-3.5 w-3.5 text-accent" />
                    Document Canvas
                  </span>
                  {selectedDocUrl && (
                    <a
                      href={selectedDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:text-foreground inline-flex items-center gap-1 normal-case text-xs transition-colors"
                    >
                      Raw View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {selectedDocUrl ? (
                  <div className="relative rounded-xl border border-border/80 overflow-hidden bg-background group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedDocUrl}
                      alt="Extracted Reddit Resume"
                      className="w-full h-auto max-h-[460px] object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="btn-overlay">
                        <Eye className="h-3 w-3" /> Click Raw View to Expand
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted bg-background rounded-xl">
                    No document preview available
                  </div>
                )}

                {/* Multi-page Thumbnail Switcher */}
                {redditDetails && redditDetails.documentUrls.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                      Gallery Pages ({redditDetails.documentUrls.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {redditDetails.documentUrls.map((url, idx) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => {
                            setSelectedDocUrl(url)
                            handleRoast(redditDetails.url, url)
                          }}
                          className={`relative shrink-0 w-14 h-18 rounded-lg border overflow-hidden transition-all cursor-pointer ${selectedDocUrl === url
                            ? "ring-2 ring-accent border-accent"
                            : "opacity-60 hover:opacity-100 border-border"
                            }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-background/80 text-foreground text-[9px] text-center font-mono py-0.5">
                            P.{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Evidence Squircles */}
              {diagnosis.evidence && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-wider text-muted">
                    <Layers className="h-3.5 w-3.5 text-accent" />
                    <span>Evidence Metrics</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MetricSquircle
                      label="Roles Count"
                      value={diagnosis.evidence.totalRolesCount ?? 0}
                      description="Identified roles"
                    />
                    <MetricSquircle
                      label="Total Bullets"
                      value={diagnosis.evidence.totalBulletsCount ?? 0}
                      description="Indexed statements"
                    />
                    <MetricSquircle
                      label="Quantified"
                      value={diagnosis.evidence.metricsCount ?? 0}
                      description="Bullets with metrics"
                      tone={diagnosis.evidence.metricsCount ? "success" : "warning"}
                    />
                    <MetricSquircle
                      label="Buzzwords"
                      value={diagnosis.evidence.buzzwordsDetected?.length ?? 0}
                      description="Clichés detected"
                      tone={(diagnosis.evidence.buzzwordsDetected?.length ?? 0) > 0 ? "error" : "neutral"}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Open Editorial Diagnostics Flow (8 Cols) */}
            <div className="lg:col-span-8 space-y-10">
              {/* Executive Diagnosis */}
              {diagnosis.executiveDiagnosis?.length > 0 && (
                <section className="space-y-4">
                  <Typography as="h3" variant="heading-3">
                    Executive Diagnosis.
                  </Typography>

                  <div className="divide-y divide-border/60 border-t border-b border-border/60">
                    {diagnosis.executiveDiagnosis.map((item, index) => (
                      <div key={index} className="py-3.5 flex items-start gap-4">
                        <span className="font-mono text-xs text-muted mt-0.5 w-5 shrink-0">
                          {String(index + 1).padStart(2, "0")}.
                        </span>
                        <p className="font-body text-foreground leading-relaxed flex-1">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Critical Red Flags & Biggest Problems */}
              {diagnosis.biggestProblems?.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
                    <Typography as="h3" variant="heading-3">
                      Critical Red Flags.
                    </Typography>
                    <span className="font-mono text-xs text-muted">
                      {diagnosis.biggestProblems.length} issue(s) detected
                    </span>
                  </div>

                  <div className="space-y-4">
                    {diagnosis.biggestProblems.map((problem, idx) => (
                      <InspectionPullout
                        key={idx}
                        variant={getSeverityTone(problem.severity)}
                        title={`[${problem.severity}] ${problem.title}`}
                      >
                        <div className="space-y-2 mt-1">
                          {problem.evidence && (
                            <div className="p-2 rounded bg-background/60 border border-border/60 font-mono text-xs text-muted">
                              <span className="text-[10px] uppercase font-semibold text-foreground block mb-0.5">
                                Document Evidence:
                              </span>
                              &ldquo;{problem.evidence}&rdquo;
                            </div>
                          )}

                          <p className="text-sm font-body text-foreground/90">
                            <strong className="font-semibold text-foreground">Why reviewers discount it: </strong>
                            {problem.explanation}
                          </p>

                          <div className="pt-1.5 flex items-start gap-2 text-xs font-semibold text-foreground">
                            <span className="px-2 py-0.5 rounded bg-foreground text-background font-mono text-[10px]">
                              FIX
                            </span>
                            <span>{problem.recommendedFix}</span>
                          </div>
                        </div>
                      </InspectionPullout>
                    ))}
                  </div>
                </section>
              )}

              {/* Bullet Surgery (Before & After Transformations) */}
              {diagnosis.bulletSurgery?.length > 0 && (
                <section className="space-y-4">
                  <div className="space-y-1 border-b border-border/60 pb-3">
                    <Typography as="h3" variant="heading-3">
                      Bullet Surgery.
                    </Typography>
                    <Typography variant="body-sm">
                      Rewriting weak, unmeasured bullets into authoritative, quantified achievements.
                    </Typography>
                  </div>

                  <div className="space-y-5">
                    {diagnosis.bulletSurgery.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border bg-surface p-5 space-y-3.5 transition-all"
                      >
                        {/* Original Bullet */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-muted">
                            <span className="text-error flex items-center gap-1">
                              Original Resume Bullet
                            </span>
                            <span className="font-mono text-[10px] text-muted">Weak Verb</span>
                          </div>
                          <p className="p-3 rounded-xl bg-error-surface border border-error-border text-sm font-body text-foreground/80 line-through decoration-error/50">
                            {item.originalBullet}
                          </p>
                        </div>

                        {/* Weakness explanation */}
                        <p className="text-xs font-body text-muted italic">
                          <span className="font-semibold not-italic text-foreground">Weakness: </span>
                          {item.problem} &mdash; {item.whyItIsWeak}
                        </p>

                        {/* Suggested Rewrite */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider">
                            <span className="text-foreground flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5 text-accent" />
                              Suggested Rewrite
                            </span>
                            <Button
                              variant="utility"
                              size="sm"
                              onClick={() => handleCopyRewrite(item.suggestedRewrite, idx)}
                              icon={copiedBulletIndex === idx ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                            >
                              {copiedBulletIndex === idx ? "Copied" : "Copy Rewrite"}
                            </Button>
                          </div>

                          <div className="p-3.5 rounded-xl bg-background border border-accent/40 text-sm font-body text-foreground font-medium shadow-2xs">
                            {item.suggestedRewrite}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ATS Parsing Matrix (Using Shared Table Component) */}
              {diagnosis.atsParsingReview && (
                <section className="space-y-4">
                  <div className="space-y-1 border-b border-border/60 pb-3">
                    <Typography as="h3" variant="heading-3">
                      ATS Parsing Matrix.
                    </Typography>
                    <Typography variant="body-sm">
                      Evaluating document readability against modern applicant tracking parser streams.
                    </Typography>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeadCell>ATS Dimension</TableHeadCell>
                        <TableHeadCell>Diagnostic Finding</TableHeadCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          Section Structure
                        </TableCell>
                        <TableCell className="text-xs leading-relaxed text-foreground/90">
                          {diagnosis.atsParsingReview.structure}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          Headings Review
                        </TableCell>
                        <TableCell className="text-xs leading-relaxed text-foreground/90">
                          {diagnosis.atsParsingReview.headings}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          Date Conventions
                        </TableCell>
                        <TableCell className="text-xs leading-relaxed text-foreground/90">
                          {diagnosis.atsParsingReview.dateConsistency}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          Keyword Density
                        </TableCell>
                        <TableCell className="text-xs leading-relaxed text-foreground/90">
                          {diagnosis.atsParsingReview.keywordStructure}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Parsing & Layout Risk Tags */}
                  {(diagnosis.atsParsingReview.parsingRisks?.length > 0 ||
                    diagnosis.atsParsingReview.layoutRisks?.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-xs font-heading font-semibold uppercase tracking-wider text-muted">
                          Parsing Risks:
                        </span>
                        {[
                          ...(diagnosis.atsParsingReview.parsingRisks || []),
                          ...(diagnosis.atsParsingReview.layoutRisks || []),
                        ].map((risk, i) => (
                          <span
                            key={i}
                            className="font-mono text-xs px-2.5 py-1 rounded-full border border-border bg-surface text-muted"
                          >
                            {risk}
                          </span>
                        ))}
                      </div>
                    )}
                </section>
              )}

              {/* Genuine Strengths */}
              {diagnosis.strengths?.length > 0 && (
                <section className="space-y-4">
                  <Typography as="h3" variant="heading-3">
                    Preserved Strengths.
                  </Typography>

                  <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
                    {diagnosis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="font-body text-foreground/90 leading-relaxed">
                          {strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Actionable Fix Roadmap */}
              {diagnosis.fixPlan && (
                <section className="space-y-4">
                  <Typography as="h3" variant="heading-3">
                    Actionable Fix Plan.
                  </Typography>

                  <div className="space-y-4">
                    {diagnosis.fixPlan.fixFirst?.length > 0 && (
                      <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-foreground text-background font-mono text-[10px] font-bold">
                            PHASE 1
                          </span>
                          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-foreground">
                            Immediate Critical Corrections
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1.5 text-sm font-body text-foreground/90 pl-1">
                          {diagnosis.fixPlan.fixFirst.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {diagnosis.fixPlan.fixNext?.length > 0 && (
                      <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-muted/30 text-foreground font-mono text-[10px] font-bold">
                            PHASE 2
                          </span>
                          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-foreground">
                            High-Value Enhancements
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1.5 text-sm font-body text-foreground/90 pl-1">
                          {diagnosis.fixPlan.fixNext.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {diagnosis.fixPlan.polishLater?.length > 0 && (
                      <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-muted/20 text-muted font-mono text-[10px] font-bold">
                            PHASE 3
                          </span>
                          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-muted">
                            Final Polish & Tuning
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1.5 text-sm font-body text-muted pl-1">
                          {diagnosis.fixPlan.polishLater.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

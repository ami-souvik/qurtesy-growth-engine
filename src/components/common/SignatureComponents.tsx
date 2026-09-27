"use client"

import * as React from "react"
import { ShieldCheck, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"

/**
 * 1. PrivacyShieldPill
 * An immutable security trust badge displaying 100% Client-Side Engine with a live pulse indicator.
 */
export function PrivacyShieldPill({
  label = "100% Client-Side Privacy",
  sublabel = "Zero Document Storage",
  className = "",
}: {
  label?: string
  sublabel?: string
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface border border-border text-foreground text-xs font-medium shadow-2xs ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="flex items-center gap-1.5 font-semibold">
        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
        {label}
      </span>
      {sublabel && (
        <>
          <span className="text-muted/40">•</span>
          <span className="text-muted font-normal">{sublabel}</span>
        </>
      )}
    </div>
  )
}

/**
 * 2. MetricSquircle
 * Continuous curvature squircle badges displaying ATS compatibility, counts, or scores.
 */
export function MetricSquircle({
  label,
  value,
  description,
  tone = "neutral",
  icon,
  className = "",
}: {
  label: string
  value: string | number
  description?: string
  tone?: "neutral" | "accent" | "success" | "warning" | "error"
  icon?: React.ReactNode
  className?: string
}) {
  const toneClasses: Record<string, string> = {
    neutral: "border-border bg-surface text-foreground",
    accent: "border-accent/40 bg-surface text-foreground",
    success: "border-success/30 bg-success-surface text-success",
    warning: "border-warning/30 bg-warning-surface text-warning",
    error: "border-error/30 bg-error-surface text-error",
  }

  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-150 ${toneClasses[tone]} ${className}`}
    >
      <div className="flex items-center justify-between text-muted text-xs font-heading uppercase tracking-wider mb-1">
        <span>{label}</span>
        {icon && <span className="text-foreground/70">{icon}</span>}
      </div>
      <div className="text-2xl sm:text-3xl font-heading font-[652] tracking-tight text-foreground">
        {value}
      </div>
      {description && (
        <p className="text-xs font-body text-muted mt-1 leading-snug">
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * 3. InspectionPullout
 * Editorial left-accent callout bars for parsing warnings, heuristic disclosures,
 * and diagnostic notes without nesting cards inside cards (anti-nesting rule).
 */
export function InspectionPullout({
  title,
  children,
  variant = "info",
  className = "",
}: {
  title?: string
  children: React.ReactNode
  variant?: "info" | "error" | "warning" | "success"
  className?: string
}) {
  const variantStyles = {
    info: "border-l-accent text-foreground bg-surface/60",
    error: "border-l-error text-foreground bg-error-surface",
    warning: "border-l-warning text-foreground bg-warning-surface",
    success: "border-l-success text-foreground bg-success-surface",
  }

  const icons = {
    info: <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />,
  }

  return (
    <div
      className={`border-l-2 py-3 px-4 rounded-r-xl space-y-1 my-3 transition-colors ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {icons[variant]}
        <div className="space-y-0.5 flex-1">
          {title && (
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-foreground">
              {title}
            </p>
          )}
          <div className="text-sm font-body text-foreground/90 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 4. FloatingControlDock
 * Floating stadium bar detached from viewport bottom with frosted glass.
 */
export function FloatingControlDock({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <div
        className={`pointer-events-auto bg-surface/85 backdrop-blur-md border border-border/80 rounded-full px-5 py-2.5 shadow-lg flex items-center gap-3 transition-all ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "utility" | "overlay"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  loading?: boolean
  href?: string
  external?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium shadow-xs active:scale-[0.98]",
  secondary:
    "bg-surface hover:bg-surface-hover text-foreground border border-border rounded-full font-medium active:scale-[0.98]",
  accent:
    "bg-accent text-accent-foreground hover:brightness-105 rounded-full font-semibold shadow-xs active:scale-[0.98]",
  utility:
    "bg-surface hover:bg-surface-hover text-muted hover:text-foreground rounded-full font-medium active:scale-[0.98]",
  overlay:
    "bg-background/80 hover:bg-background text-foreground backdrop-blur-md border border-border/60 rounded-full font-medium shadow-sm active:scale-[0.98]",
}

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3.5 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  href,
  external,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
  const classes = `${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {!loading && icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}
    </>
  )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={classes}
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {content}
    </button>
  )
}

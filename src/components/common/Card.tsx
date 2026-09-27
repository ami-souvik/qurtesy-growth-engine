"use client"

import * as React from "react"
import Link from "next/link"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "featured" | "polar"
  interactive?: boolean
  href?: string
}

const cardVariantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  standard: "bg-surface border border-border text-foreground",
  featured: "bg-surface border border-accent/50 shadow-sm text-foreground",
  polar: "bg-foreground text-background border border-foreground/10",
}

export function Card({
  children,
  variant = "standard",
  interactive = false,
  href,
  className = "",
  ...props
}: CardProps) {
  const baseClasses = `rounded-2xl transition-all duration-200 ${cardVariantStyles[variant]} ${
    interactive
      ? "hover:border-foreground/30 hover:shadow-xs active:scale-[0.99] cursor-pointer"
      : ""
  } ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pb-3 space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-heading font-bold text-foreground leading-snug tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-muted font-body leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 flex items-center ${className}`} {...props}>
      {children}
    </div>
  )
}

import * as React from "react"

export type TypographyVariant =
  | "display"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "title"
  | "body-lg"
  | "body"
  | "body-sm"
  | "label"
  | "caption"

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
  variant?: TypographyVariant
  kicker?: string
  subtitle?: string
  centered?: boolean
}

const variantStyles: Record<TypographyVariant, string> = {
  display:
    "text-5xl sm:text-7xl lg:text-[80px] font-heading font-[652] leading-none tracking-normal text-foreground",
  "heading-1":
    "text-4xl sm:text-5xl lg:text-[56px] font-heading font-[652] leading-none tracking-normal text-foreground",
  "heading-2":
    "text-3xl sm:text-4xl lg:text-[44px] font-heading font-[652] leading-[1.13] tracking-normal text-foreground",
  "heading-3":
    "text-2xl sm:text-3xl lg:text-[32px] font-heading font-[652] leading-[1.13] tracking-normal text-foreground",
  "heading-4":
    "text-xl sm:text-2xl lg:text-[24px] font-heading font-[652] leading-[1.25] tracking-normal text-foreground",
  title:
    "text-lg sm:text-xl font-heading font-semibold leading-[1.3] tracking-normal text-foreground",
  "body-lg":
    "text-lg sm:text-xl font-body font-[300] leading-[1.38] tracking-normal text-muted",
  body:
    "text-base font-body font-[456] leading-[1.38] tracking-normal text-foreground/90",
  "body-sm":
    "text-sm font-body font-[456] leading-[1.43] tracking-normal text-muted",
  label:
    "text-xs font-heading font-semibold uppercase tracking-wider leading-[1.33] text-foreground",
  caption:
    "text-xs font-body font-[456] leading-[1.33] tracking-normal text-muted",
}

export function Typography({
  as: Component = "p",
  variant = "body",
  kicker,
  subtitle,
  centered = false,
  className = "",
  children,
  ...props
}: TypographyProps) {
  const alignClass = centered ? "text-center mx-auto" : ""

  if (kicker || subtitle) {
    return (
      <div className={`space-y-2 ${alignClass} ${className}`}>
        {kicker && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-semibold uppercase tracking-wider border border-accent/25">
            {kicker}
          </div>
        )}
        <Component className={`${variantStyles[variant]}`} {...props}>
          {children}
        </Component>
        {subtitle && (
          <p className="text-base sm:text-lg font-body font-[300] leading-[1.38] text-muted max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    )
  }

  return (
    <Component
      className={`${variantStyles[variant]} ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

---
name: "Qurtesy Design System"
version: "1.0.0"
description: "Design system specification for Qurtesy: authoritative document engineering, privacy-first career micro-tools, and ATS-optimized resume software."
tokens:
  colors:
    light:
      background: "#ffffff"
      foreground: "#0f172a"
      surface: "#f9fafb"
      surfaceHover: "#f3f4f6"
      border: "#e2e8f0"
      muted: "#64748b"
      accent: "#ecd078"
      accentForeground: "#1f1f1f"
      error: "#ef4444"
      errorSurface: "#fef2f2"
      errorBorder: "#fecaca"
      warning: "#f59e0b"
      warningSurface: "#fffbeb"
      warningBorder: "#fde68a"
      success: "#10b981"
      successSurface: "#ecfdf5"
      successBorder: "#a7f3d0"
    dark:
      background: "#0c0d0e"
      foreground: "#f4f4f5"
      surface: "#141517"
      surfaceHover: "#1c1d21"
      border: "#27272a"
      muted: "#a1a1aa"
      accent: "#f59e0b"
      accentForeground: "#09090b"
      error: "#f87171"
      errorSurface: "rgba(239, 68, 68, 0.1)"
      errorBorder: "rgba(239, 68, 68, 0.25)"
      warning: "#fbbf24"
      warningSurface: "rgba(245, 158, 11, 0.1)"
      warningBorder: "rgba(245, 158, 11, 0.25)"
      success: "#34d399"
      successSurface: "rgba(16, 185, 129, 0.1)"
      successBorder: "rgba(16, 185, 129, 0.25)"
  typography:
    fonts:
      sans: "Inter Tight, var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      serif: "Ovo, 'Playfair Display', Georgia, serif"
      display: "'Playfair Display', 'DM Serif Display', Georgia, serif"
      mono: "var(--font-geist-mono), 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    scales:
      display:
        {
          fontSize: "80px",
          lineHeight: "1.0",
          fontWeight: "652",
          letterSpacing: "0",
        }
      heading-1:
        {
          fontSize: "56px",
          lineHeight: "1.0",
          fontWeight: "652",
          letterSpacing: "0",
        }
      h1:
        {
          fontSize: "3rem",
          lineHeight: "1.15",
          fontWeight: "700",
          letterSpacing: "-0.025em",
        }
      heading-2:
        {
          fontSize: "44px",
          lineHeight: "1.13",
          fontWeight: "652",
          letterSpacing: "0",
        }
      h2:
        {
          fontSize: "2rem",
          lineHeight: "1.25",
          fontWeight: "700",
          letterSpacing: "-0.02em",
        }
      heading-3:
        {
          fontSize: "32px",
          lineHeight: "1.13",
          fontWeight: "652",
          letterSpacing: "0",
        }
      h3:
        {
          fontSize: "1.5rem",
          lineHeight: "1.3",
          fontWeight: "600",
          letterSpacing: "-0.015em",
        }
      heading-4:
        {
          fontSize: "24px",
          lineHeight: "1.25",
          fontWeight: "652",
          letterSpacing: "0",
        }
      h4: { fontSize: "1.125rem", lineHeight: "1.4", fontWeight: "600" }
      title:
        {
          fontSize: "20px",
          lineHeight: "1.3",
          fontWeight: "600",
          letterSpacing: "0",
        }
      bodyLarge:
        {
          fontSize: "20px",
          lineHeight: "1.38",
          fontWeight: "300",
          letterSpacing: "0",
        }
      body:
        {
          fontSize: "16px",
          lineHeight: "1.38",
          fontWeight: "456",
          letterSpacing: "0",
        }
      bodySmall:
        {
          fontSize: "14px",
          lineHeight: "1.43",
          fontWeight: "456",
          letterSpacing: "0",
        }
      link:
        {
          fontSize: "16px",
          lineHeight: "1.38",
          fontWeight: "600",
          letterSpacing: "0",
        }
      label:
        {
          fontSize: "12px",
          lineHeight: "1.33",
          fontWeight: "600",
          letterSpacing: "0",
        }
      caption:
        {
          fontSize: "12px",
          lineHeight: "1.33",
          fontWeight: "456",
          letterSpacing: "0",
        }
  radii:
    none: "0px"
    sm: "0.25rem"
    md: "0.375rem"
    lg: "0.5rem"
    xl: "0.75rem"
    "2xl": "1rem"
    "3xl": "1.5rem"
    full: "9999px"
  spacing:
    grid: "4px"
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
  containers:
    page: "max-w-6xl"
    article: "max-w-4xl"
    hero: "max-w-3xl"
---

# DESIGN.md - Qurtesy Design System

> **Qurtesy** is a privacy-first resume optimization platform and client-side document engineering suite.  
> This specification is the authoritative single source of truth for all visual identity, component architecture, layout hierarchy, and typographic rules across the platform.

---

## 1. Visual Theme & Atmosphere

Qurtesy balances **academic authority**, **computational precision**, and **modern developer-tool elegance**.

### The Aesthetic Formula:

- **Swiss Document Rigor**: Clear, legible, single-column document hierarchies inspired by ISO standards, LaTeX, and technical typesetting.
- **Warm Editorial Prestige**: Timeless serif headings (`Ovo`, `Playfair Display`) evoke trust, editorial authority, and journalistic credibility.
- **Sleek Dark Mode Dev-Tool Feel**: The default dark theme (`#121212`, `#1f1f1f`, `#303030`) feels like a refined engineering workstation (Linear, Stripe Press, Raycast), highlighted by a warm champagne-gold accent (`#ecd078`).

---

## 2. Color System & Semantic Roles

All colors are controlled via CSS custom properties in `globals.css` with semantic token bindings.

### Core Palettes

| Semantic Role         | CSS Variable          | Light Theme | Dark Theme | Purpose / Usage                               |
| :-------------------- | :-------------------- | :---------- | :--------- | :-------------------------------------------- |
| **Background**        | `--background`        | `#ffffff`   | `#0c0d0e`  | Main canvas background                        |
| **Foreground**        | `--foreground`        | `#0f172a`   | `#f4f4f5`  | Primary text and high-contrast elements       |
| **Surface**           | `--surface`           | `#f9fafb`   | `#141517`  | Cards, sidebars, dropzones, panels            |
| **Surface Hover**     | `--surface-hover`     | `#f3f4f6`   | `#1c1d21`  | Hover states for interactive surfaces         |
| **Border**            | `--border`            | `#e2e8f0`   | `#27272a`  | Subtle hairline dividers and outlines         |
| **Muted**             | `--muted`             | `#64748b`   | `#a1a1aa`  | Secondary descriptions, captions, dates       |
| **Accent**            | `--accent`            | `#d97706`   | `#f59e0b`  | Warm gold highlight, badge icons, focus rings |
| **Accent Foreground** | `--accent-foreground` | `#ffffff`   | `#09090b`  | Text rendered on top of accent fill           |

### Semantic Functional Colors

| Function               | Dark Mode Fill            | Border / Text         | Usage Rule                                               |
| :--------------------- | :------------------------ | :-------------------- | :------------------------------------------------------- |
| **Error / Collision**  | `rgba(239, 68, 68, 0.1)`  | `#ef4444` / `#f87171` | ATS stream scramble, rasterization traps, failed parsing |
| **Success / Valid**    | `rgba(16, 185, 129, 0.1)` | `#10b981` / `#34d399` | Deterministic descent, ATS passed, 100% privacy          |
| **Warning / Notice**   | `rgba(245, 158, 11, 0.1)` | `#f59e0b` / `#fbbf24` | Scanned PDF warnings, OCR fallback notices               |
| **Information / Tool** | `rgba(59, 130, 246, 0.1)` | `#3b82f6` / `#60a5fa` | Client-side parser tools, technical notes                |

### Palette Discipline: Strict Color Restraint Rule

- **Stick strictly to the defined color palette**: Never introduce arbitrary rainbow hues (e.g. ad-hoc purples, teals, pinks, light blues, or yellow ribbons) across marketing components or UI workflows.
- **One Brand Accent**: The platform's primary visual signal is warm champagne gold (`var(--accent)` / `#ecd078`). All badges, focus highlights, indicators, and primary visual anchors must use `--accent` or core neutrals (`--foreground`, `--muted`, `--border`, `--surface`).
- **Functional colors are exceptions, not decoration**: Emerald (`success`), Red (`error`), and Amber (`warning`) are strictly reserved for functional diagnostics (ATS status, validation, security checks)—never for random decorative color-coding of features or workflow stages.

---

## 3. Typography Architecture

### Font Families & Single-Typeface System

Qurtesy uses **Inter** (contemporary neo-grotesque) exclusively across the application interface, headings, and body copy. Variable font weights provide distinct editorial personality without loading conflicting font families.

1. **Interface, Headings & Text**: `'Inter'`, `'Inter Tight'`, `var(--font-geist-sans)`, sans-serif (`--font-sans`).
   - Used universally via the `<Typography>` component (`text-display`, `text-heading-1`..`4`, `text-title`, `text-body`, etc.).
2. **Brand Logo Mark Exclusively**: `Ovo`, `'Playfair Display'`, serif (`font-serif`).
   - **Strict Rule**: The serif font is reserved exclusively for the "Qurtesy." wordmark logo. All page titles, headings, and content must use `<Typography>` (sans-serif Inter).
3. **Data, Code & Coordinates**: `var(--font-geist-mono)`, monospace (`--font-mono`).
   - Use for: Coordinate math formulas (`|y₁ - y₂| ≤ 3.5pt`), JSON outputs, line tags (`Col 1`, `Col 2`), file paths.

### Typographic Hierarchy & Scale Specimen

The voice leverages distinctive variable-font weight positions: chunky 652 for headings, bookish 456 for body text, an airy 300 for hero subtitles, and zero letter-spacing across all scales. All major headlines conclude with a definitive period.

```text
display   - 80px | weight: 652 | lh: 1.00 | tracking: 0  | "Discover real-world design inspiration."
heading-1 - 56px | weight: 652 | lh: 1.00 | tracking: 0  | "Design like a Pro."
heading-2 - 44px | weight: 652 | lh: 1.13 | tracking: 0  | "The votes are in."
heading-3 - 32px | weight: 652 | lh: 1.13 | tracking: 0  | "Create your free account"
heading-4 - 24px | weight: 652 | lh: 1.25 | tracking: 0  | "Find design patterns in seconds"
title     - 20px | weight: 600 | lh: 1.30 | tracking: 0  | "Frequently asked questions"
body-lg   - 20px | weight: 300 | lh: 1.38 | tracking: 0  | "Featuring over 1,000 iOS & Web apps, and 200 sites — new content weekly."
body      - 16px | weight: 456 | lh: 1.38 | tracking: 0  | "Get full access to all apps & features. Cancel anytime."
body-sm   - 14px | weight: 456 | lh: 1.43 | tracking: 0  | "For teams and agencies. Centralized billing, seat-based pricing."
link      - 16px | weight: 600 | lh: 1.38 | tracking: 0  | "Pricing · Awards · Log in"
label     - 12px | weight: 600 | lh: 1.33 | tracking: 0  | "POPULAR"
caption   - 12px | weight: 456 | lh: 1.33 | tracking: 0  | "No credit card required."
```

---

## 4. Layout Principles & Hierarchy Rules

### Rule 1: No "Container Nesting Syndrome" (Box Fatigue)

- **Do NOT nest cards inside cards inside cards.**
- Editorial longform (such as blog posts, guides, and teardowns) MUST flow as clean, open typography.
- Use whitespace (`mt-14 pt-8 border-t border-border/60`) and clear typographic rhythm rather than wrapping entire sections in rounded bordered boxes.
- Reserve card containers for **interactive modules** (e.g., FileDropzone, Live Action Cards, Hero Tools).

### Rule 2: Container Widths

- **Platform / Standard Pages**: `max-w-6xl mx-auto px-4 sm:px-6` (via `<PageLayout>`).
- **Editorial / Article Prose**: `max-w-4xl mx-auto` to prevent excessive line length and maximize reading ergonomics.
- **Hero Intro Text**: `max-w-3xl` or `max-w-2xl` for crisp, punchy messaging.

### Rule 3: Vertical Rhythm & Spacing Grid

- Built on an 8pt base grid (`gap-2` = 8px, `gap-4` = 16px, `gap-8` = 32px, `gap-12` = 48px, `gap-16` = 64px).
- Generous spacing between distinct thoughts (`my-8` or `my-12`).

---

## 5. Component Patterns & Interaction Guidelines

#### 5.1 Button Variants (Mobbin-Inspired Control System)

Qurtesy uses a refined control ladder that balances high-contrast CTAs, subdued functional twins, utility pills, and status actions:

- **Primary Action (`.btn-default` / High-Contrast Ink CTA)**:
  - _Mobbin Inspiration_: The single primary CTA style everywhere — high-contrast fill with stadium-pill or rounded-xl geometry, crisp contrast typography, and subtle focus rings.
  - _Specification_: `bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-3 text-sm font-medium transition-all shadow-xs active:scale-[0.98]`
  - _Usage_: Main page converters, "Audit My Resume", "Launch Builder", "Download PDF".

- **Secondary Outline Action (`.btn-ghost` / Hairline Twin)**:
  - _Mobbin Inspiration_: De-emphasized twin — surface fill, 1px subtle hairline, identical pill geometry.
  - _Specification_: `bg-surface hover:bg-surface-hover text-foreground border border-border rounded-full px-5 py-3 text-sm font-medium transition-colors`
  - _Usage_: Secondary options, cancel actions, export variants, modal dismissals.

- **Accent Gold Highlight Action (`.btn-accent` / Commercial & Pro Signal)**:
  - _Mobbin Inspiration_: Like Mobbin's single electric blue signal reserved for pro/commercial features, Qurtesy reserves `#ecd078` champagne gold for pro tier, AI-enhanced actions, and verified ATS checks.
  - _Specification_: `bg-accent text-accent-foreground hover:brightness-105 active:scale-[0.98] rounded-full px-5 py-3 text-sm font-semibold transition-all shadow-xs`
  - _Usage_: "Score with AI", "Tailor with Gemini", "Upgrade to Pro".

- **Subtle Utility Pill (`.btn-utility`)**:
  - _Mobbin Inspiration_: Borderless soft-canvas fill for outbound links, filters, and auxiliary tool switching.
  - _Specification_: `bg-surface hover:bg-surface-hover text-muted hover:text-foreground rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors`
  - _Usage_: Filter pills, tag filters, copy button chips, breadcrumbs.

- **Translucent Media/Canvas Pill (`.btn-overlay`)**:
  - _Mobbin Inspiration_: Translucent pill laid over photography, document previews, and canvas viewers.
  - _Specification_: `bg-background/80 hover:bg-background text-foreground backdrop-blur-md border border-border/60 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm transition-all`
  - _Usage_: Zoom controls, page navigation overlays on resume canvas, full-screen toggle.

#### 5.2 Cards & Surfaces (Anti-Nesting Hierarchy & Action Cards)

- **High-Voltage Action Cards (`<ActionCards />`)**:
  - _Mobbin & Editorial Inspiration_: High-impact visual anchor cards engineered with rich, deep, intentional colors rather than generic tones.
  - **Coral Card (`#b82e06`)**: Highest-voltage hero card carrying the brand's most direct value claim ("Production resumes in prototype speed"), paired with a dark ink pill CTA (`#0f1115`).
  - **Forest Green Card (`#0f3e1a`)**: Sibling card with identical geometry and tactile voltage ("Don't just talk. Deploy it."), paired with deep forest button (`#0a1b0e`).
  - **Dark Navy CTA Card (`#151b26`)**: Mid-page anchoring CTA where dark ink is both the typography color and signature dark foundation ("The path to 10× every person in your organization").
  - **Tabbed Feature Card (`#15161a`)**: Horizontal split layout with a left rail of vertical navigation tabs and a right content pane with a small utility CTA pill.
  - **Cream Callout Band (`#f5edd7`)**: Warm soft-beige callout surface with high-contrast text and stats, quieter than the coral/forest/dark cards.

- **Standard Document Surface (`.surface-card`)**:
  - Pure surface fill (`bg-surface`), 1px soft hairline border (`border-border`), and rounded-2xl geometry (`rounded-2xl`).
- **Featured / Recommended Surface (`.surface-featured`)**:
  - Accent-tinted border (`border-accent/40`), subtle gradient wash or soft background tint, carrying a champagne-gold pill badge (`Pro` or `ATS Verified`).
- **Collapsible Inspection Rows**:
  - Clean dividers (`divide-y divide-border/60`) without card nesting; hover state triggers `bg-surface-hover/50`.
- **Footer Polar Band**:
  - High-contrast, inverted surface band anchoring the end of pages with rounded-t-3xl corners.

#### 5.3 Form Controls & Interactive Inputs

- **Field Input (`.input-surface` / `<Input />`)**:
  - Soft ink-wash fill (`bg-surface/50 dark:bg-[#141517]/80`), 2px subtle hairline (`border-2 border-border/80 hover:border-border`), and generous `rounded-2xl` geometry with comfortable `px-4 py-3 text-sm` padding.
  - Faint placeholder (`text-muted/60`), disabled styling (`disabled:opacity-50 disabled:cursor-not-allowed`).
  - _Focus state_: 2px solid foreground boundary with soft glow ring (`focus:bg-background dark:focus:bg-[#0c0d0e] focus:border-foreground/80 dark:focus:border-foreground/70 focus:ring-2 focus:ring-foreground/5 dark:focus:ring-foreground/10 outline-none shadow-xs`).
- **Segmented Stadium Toggle Track (`.toggle-stadium`)**:
  - Soft-surface stadium track (`bg-surface/80 rounded-2xl p-1 border border-border/80 shadow-2xs`).
  - Active segment is an elevated surface pill (`bg-foreground text-background font-semibold shadow-xs rounded-xl px-3 py-1.5 text-xs transition-all`).

#### 5.4 Qurtesy Signature Components

Drawing inspiration from Mobbin's floating pill navigation, squircle app icons, curator strips, and comparison matrices, Qurtesy introduces signature domain-specific components:

1. **Floating Document Control Dock (`<FloatingControlDock />`)**:
   - A horizontally-centered stadium bar detached from the viewport bottom edge with frosted glass (`bg-surface/85 backdrop-blur-md border border-border/80 rounded-full px-4 py-2 shadow-lg`). Holds page zoom, template switchers, ATS pass indicators, and download triggers.
2. **ATS Stream Collision Matrix (`<Table />`)**:
   - A dual-column split matrix comparing **"What You See (Human PDF)"** against **"What Robots Read (ATS Stream)"** with green/red status tokens and monospace coordinate tracking. Built with the shared `<Table>` component family.
3. **Deterministic Privacy Shield Pill (`<PrivacyShieldPill />`)**:
   - An immutable security badge displaying `100% Client-Side Engine` with a live WebAssembly / IndexedDB green pulse indicator.
4. **Interactive Document Inspection Pullout (`<InspectionPullout />`)**:
   - Editorial left-accent callout bars (`border-l-2 py-1 pl-4`) for parsing warnings, heuristic disclosures, and typographic specifications without card wrapping.
5. **Resume Metric Squircle Badge (`<MetricSquircle />`)**:
   - Continuous curvature squircle badges (`rounded-2xl p-3 border border-border bg-surface`) displaying ATS compatibility scores, word count, and reading time.

#### 5.5 Canonical Shared Components Registry

All components in Qurtesy are implemented as zero-friction, modular shared components under `src/components/common/`. Always import and use these shared components directly across pages, tools, and templates instead of authoring ad-hoc HTML or unstyled elements:

| Component Name          | Import Statement                                                                                                 | Key Props / Variants                                                                                                                                          | Primary Use Case                                                   |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| **Button**              | `import { Button } from "@/components/common/Button";`                                                           | `variant`: `"primary"` \| `"secondary"` \| `"accent"` \| `"utility"` \| `"overlay"`<br/>`size`: `"sm"` \| `"md"` \| `"lg"`<br/>`icon`, `iconPosition`, `href` | All interactive triggers, links, CTAs, action bars.                |
| **Card**                | `import { Card, CardHeader, CardFooter } from "@/components/common/Card";`                                       | `variant`: `"standard"` \| `"featured"` \| `"polar"`<br/>`interactive`, `href`                                                                                | Tool cards, template catalog items, feature cards, surface blocks. |
| **Typography**          | `import { Typography } from "@/components/common/Typography";`                                                   | `as`: `"h1"` \| `"h2"` \| `"h3"` \| `"h4"`<br/>`kicker`, `subtitle`, `centered`                                                                               | Editorial & page headers maintaining the exact typography scale.   |
| **ActionCards**         | `import { ActionCards } from "@/components/common/ActionCards";`                                                 | `coralCard`, `forestCard`, `navyCard`, `tabbedCard`, `calloutBand`                                                                                            | High-voltage hero cards, marketing callouts, landing pages.        |
| **Table**               | `import { Table, TableHeader, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/common/Table";` | Standard table compound components                                                                                                                            | Comparison matrices, ATS stream logs, data tables.                 |
| **ToolCard**            | `import ToolCard from "@/components/tools/ToolCard";`                                                            | `tool`: `ToolData` (`title`, `description`, `href`, `icon`, `colorClass`)                                                                                     | Free career and developer tool showcase cards.                     |
| **TemplateCard**        | `import TemplateCard from "@/components/templates/TemplateCard";`                                                | `template`: `RoleTemplateData` (`slug`, `jobRole`, `description`, `atsKeywords`)                                                                              | Role-based and ATS resume catalog cards.                           |
| **FloatingControlDock** | `import { FloatingControlDock } from "@/components/common/SignatureComponents";`                                 | `templateName`, `documentSize`, `zoom`, `onExport`, `exportHref`                                                                                              | Floating canvas dock on resume builder and preview screens.        |
| **PrivacyShieldPill**   | `import { PrivacyShieldPill } from "@/components/common/SignatureComponents";`                                   | `label`, `sublabel`                                                                                                                                           | Trust badge on hero sections, uploaders, and tool headers.         |
| **MetricSquircle**      | `import { MetricSquircle } from "@/components/common/SignatureComponents";`                                      | `label`, `value`, `description`, `tone`, `icon`                                                                                                               | ATS score cards, word count statistics, diagnostics.               |
| **InspectionPullout**   | `import { InspectionPullout } from "@/components/common/SignatureComponents";`                                   | `title`, `variant`: `"info"` \| `"error"` \| `"warning"` \| `"success"`                                                                                       | Editorial warnings, ATS collision notes, non-nested callouts.      |

---

## 6. Do’s and Don’ts

### DO:

- ✅ **Emphasize Client-Side Privacy**: Always visually reinforce that resume processing occurs 100% in-browser with zero server data storage.
- ✅ **Use Rich Typographic Contrast**: Pair serif display headings (`Ovo`, `Playfair Display`) with geometric sans body copy (`Inter Tight`).
- ✅ **Use Stadium Pills for Controls**: Use `rounded-full` for interactive triggers, filter tabs, and floating docks to provide a tactile, modern feel.
- ✅ **Keep Line Lengths Ergonomic**: Use `max-w-4xl` for longform prose and `max-w-prose` for text blocks to maintain 65–75 characters per line.
- ✅ **Use Monospace for Coordinates & Math**: Highlight transformation matrices, coordinates `(x, y)`, and algorithms with `font-mono`.
- ✅ **Respect Both Themes**: Test contrast for dark mode (`#121212` base) and light mode (`#ffffff` base).

### DON’T:

- ❌ **Don't Create Box-in-Box Inceptions**: Never put a card inside a card inside a card. Use whitespace, divider rules, and left-border pullouts.
- ❌ **Don't Use So Many Different Colors**: Stick strictly to the core color palette. Never create a rainbow patchwork of cards or steps (e.g. purple, teal, blue, amber, green in one block). Maintain monochromatic elegance with neutral surfaces, subtle borders, and the singular `--accent` gold.
- ❌ **Don't Use Generic Utility Colors**: Avoid plain `text-blue-500`, `text-green-500`, or raw hex codes. Use CSS semantic tokens (`text-accent`, `text-muted`, `border-border`).
- ❌ **Don't Use Flashy Animations**: Keep transitions fast (`150ms` to `200ms`) and subtle (`active:scale-[0.98]`, `group-hover:translate-x-0.5`). Never distract from document legibility.
- ❌ **Don't Hide Navigation**: Ensure home, tools, templates, blog, and builder are accessible with minimal clicks.

---

## 7. AI Agent Guidelines (How to Use This File)

When generating new pages, components, or blog posts for Qurtesy:

1. **Always read this file first** to maintain brand continuity.
2. **Apply `<PageLayout>`** for consistency in navigation, spacing, and footers.
3. **Use the defined typography hierarchy**: H1/H2 in Serif (`font-serif`), body in Sans (`font-sans`), and data in Mono (`font-mono`).
4. **Follow the layout guidelines**: In editorial content, default to open typographic flow rather than wrapping text in card containers.
5. **Employ the Signature Component library**: Utilize the Floating Control Dock, ATS Stream Collision Matrix, Privacy Shield Pill, and Segmented Stadium Toggles.
6. **Preserve SEO & Schema Integrity**: Keep JSON-LD schemas (`Organization`, `SoftwareApplication`, `BlogPosting`, `BreadcrumbList`) aligned with canonical URLs and schema.org standards.

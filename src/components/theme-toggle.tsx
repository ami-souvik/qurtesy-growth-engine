"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

const emptySubscribe = () => () => {}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!isClient) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`h-9 w-9 rounded-full border border-border/80 bg-surface flex items-center justify-center text-muted transition-colors opacity-70 ${className}`}
      >
        <span className="h-4 w-4" />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={`relative h-9 w-9 rounded-full border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-foreground transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer ${className}`}
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 absolute ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100 text-amber-500"
        }`}
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 absolute ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-accent"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  )
}

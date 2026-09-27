"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  resolvedTheme: "dark",
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme
  try {
    const saved = localStorage.getItem(storageKey) as Theme | null
    return saved || defaultTheme
  } catch {
    return defaultTheme
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "qurtesy-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme)
  )

  const isSystemDark = React.useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia("(prefers-color-scheme: dark)")
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => true
  )

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (isSystemDark ? "dark" : "light") : theme

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {
        // ignore storage errors
      }
      setThemeState(newTheme)
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { name: "Roast My Resume", href: "/roast-resume" },
]

// Subtle tactile audio feedback using Web Audio API
function playTactileFeedback() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(440, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.04)
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.04)
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleNavClick = () => {
    playTactileFeedback()
    setMobileMenuOpen(false)
  }

  return (
    <header className="w-full md:w-60 md:h-screen md:shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-border bg-surface/90 backdrop-blur-md z-30 transition-colors">
      {/* Brand & Mobile Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <Link
          href="/roast-resume"
          onClick={handleNavClick}
          className="group flex flex-col select-none cursor-pointer"
        >
          <span className="text-2xl font-serif font-bold tracking-tight text-foreground transition-transform group-hover:translate-x-0.5">
            Qurtesy<span className="text-accent">.</span>
          </span>
        </Link>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              playTactileFeedback()
              setMobileMenuOpen(!mobileMenuOpen)
            }}
            aria-label="Toggle navigation menu"
            className="h-9 w-9 rounded-full border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-foreground transition-all active:scale-95 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div
        className={`${mobileMenuOpen ? "flex" : "hidden"
          } md:flex flex-col flex-1 justify-between p-3 space-y-1 overflow-y-auto animate-in fade-in slide-in-from-top-2 md:animate-none`}
      >
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(`${item.href}/`) && item.href !== "/") ||
              pathname === "/"

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4.5 py-2.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.98] select-none cursor-pointer ${isActive
                  ? "bg-foreground text-background shadow-xs font-semibold"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
              >
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Theme Toggle Footer */}
        <div className="hidden md:flex items-center justify-between px-3 pt-3">
          <span className="text-xs font-body text-muted">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

import type { Metadata } from "next";
import { Manrope, Inter_Tight, Space_Mono, Ovo } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";


const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope", // Define your CSS variable name
});

const neue_haas_grotesk = localFont({
  src: "./fonts/neuehaasgrotdisp-55roman-trial.otf",
  weight: "100 900",
  variable: "--font-neue-haas-grotesk",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight", // Define your CSS variable name
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const ovo = Ovo({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-ovo",
});

export const metadata: Metadata = {
  title: "Qurtesy · Roast My Resume",
  description:
    "Authoritative document engineering, privacy-first career micro-tools, and ATS-optimized resume software.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${neue_haas_grotesk.variable} ${interTight.variable} ${spaceMono.variable} ${ovo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300..700;1,300..700&family=Ovo&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="dark" storageKey="qurtesy-theme">
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

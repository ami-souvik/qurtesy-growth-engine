"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database } from "lucide-react"

const navigation = [
  { name: "Data Sources", href: "/", icon: Database },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-48 flex-col border-r bg-muted/20">
      <div className="flex flex-col items-start px-4 py-2">
        <p className="text-lg font-serif font-bold leading-tight">Qurtesy.</p>
        <p className="text-xs font-semibold leading-tight">Growth Engine</p>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

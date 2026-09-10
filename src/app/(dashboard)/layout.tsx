import { AppSidebar } from "@/components/layout/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}

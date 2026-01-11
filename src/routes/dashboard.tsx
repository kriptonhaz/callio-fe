import { useState } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    // Check for token before rendering component
    // Use typeof window to ensure this only runs on client-side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('callio_access_token')
      if (!token) {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        })
      }
    }
  },
  component: DashboardLayout,
})

function DashboardLayout(): React.ReactElement {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev)

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onMenuClick={toggleMobileSidebar}
        isSidebarOpen={isMobileSidebarOpen}
      />
    </div>
  )
}

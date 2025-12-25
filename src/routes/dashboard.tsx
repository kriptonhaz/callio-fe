import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import React from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()

  // Client-side auth check to redirect to login if no token
  React.useEffect(() => {
    const token = localStorage.getItem('callio_access_token')
    if (!token) {
      navigate({ to: '/login', replace: true })
    }
  }, [navigate])

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: RootRedirect,
})

function RootRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for authentication token in localStorage (client-side only)
    const token = localStorage.getItem('callio_access_token')

    // If token exists, redirect to dashboard
    if (token) {
      navigate({ to: '/dashboard', replace: true })
    } else {
      // If no token, redirect to login
      navigate({ to: '/login', replace: true })
    }
  }, [navigate])

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}

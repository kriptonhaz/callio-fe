import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';


export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    // Basic auth check
    // Basic auth check using localStorage directly since we're using API auth
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('callio_access_token');
      if (!token && location.pathname !== '/login') {
        throw redirect({
          to: '/login',
        });
      }
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
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
  );
}

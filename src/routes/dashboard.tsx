import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { authStore } from '@/store/authStore';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    // Basic auth check
    const state = authStore.state;
    if (!state.isAuthenticated && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-background">
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

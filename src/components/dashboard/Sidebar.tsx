import { useState, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/api/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LayoutDashboard } from '@/components/animate-ui/icons/layout-dashboard';
import { Users } from '@/components/animate-ui/icons/users';
import { Phone } from '@/components/animate-ui/icons/phone';
import { Calendar } from '@/components/animate-ui/icons/calendar';
import { PieChart } from '@/components/animate-ui/icons/pie-chart';
import { FileText } from '@/components/animate-ui/icons/file-text';
import { Settings } from '@/components/animate-ui/icons/settings';
import { Globe } from '@/components/animate-ui/icons/globe';
import { Activity } from '@/components/animate-ui/icons/activity';
import { useTranslation } from 'react-i18next';
import { decodeJwt } from '@/lib/jwt';
import { getAccessToken } from '@/lib/api/client';
import { useUser } from '@/hooks/api/useUsers';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const logout = useLogout();

  // Role determination logic
  const token = getAccessToken();
  const decodedToken = useMemo(() => token ? decodeJwt(token) : null, [token]);
  const userId = decodedToken?.sub;
  const jwtRole = decodedToken?.role;

  // Periodically fetch user to verify role (double security)
  const { data: user } = useUser(userId || '', { refetchInterval: 60000 });
  
  // Effective role: prefer API data, fallback to JWT
  const role = user?.role || jwtRole;

  const menuItems = useMemo(() => {
    const commonItems = [
      { icon: LayoutDashboard, label: t('dashboard.menu.dashboard'), href: '/dashboard' },
    ];

    if (role === 'superadmin') {
      return [
        ...commonItems,
        { icon: Globe, label: t('dashboard.menu.gsmDevices', 'GSM Devices'), href: '/dashboard/gsm-devices' },
        { icon: Users, label: t('dashboard.menu.client', 'Client'), href: '/dashboard/clients' },
        { icon: Activity, label: t('dashboard.menu.log', 'Log'), href: '/dashboard/logs' },
        { icon: Settings, label: t('dashboard.menu.settings'), href: '/dashboard/settings' },
      ];
    }

    if (role === 'admin' || role === 'supervisor') {
      return [
        ...commonItems,
        { icon: Users, label: t('dashboard.menu.users', 'Users'), href: '/dashboard/users' },
        { icon: Calendar, label: t('dashboard.menu.campaign', 'Campaign'), href: '/dashboard/campaigns' },
        { icon: Phone, label: t('dashboard.menu.leads'), href: '/dashboard/leads' },
        { icon: PieChart, label: t('dashboard.menu.reports'), href: '/dashboard/reports' },
        { icon: FileText, label: t('dashboard.menu.recordings'), href: '/dashboard/recordings' },
        { icon: Settings, label: t('dashboard.menu.settings'), href: '/dashboard/settings' },
      ];
    }

    if (role === 'agent') {
      return [
        ...commonItems,
        { icon: Calendar, label: t('dashboard.menu.campaign', 'Campaign'), href: '/dashboard/campaigns' },
        { icon: Settings, label: t('dashboard.menu.settings'), href: '/dashboard/settings' },
      ];
    }

    // Default fallback
    return commonItems;
  }, [role, t]);

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="h-full bg-card border-r border-border relative flex flex-col shadow-sm z-10"
    >
      <div className="p-4 flex items-center justify-between border-b border-border h-16">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-2xl text-primary tracking-tight"
            >
              Callio
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = item.href === '/dashboard' 
              ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className="block"
              >
                <AnimateIcon animateOnHover asChild>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-md transition-colors group relative overflow-hidden cursor-pointer",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon size={20} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-3 whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                      />
                    )}
                  </div>
                </AnimateIcon>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || decodedToken?.email?.charAt(0) || 'U'}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-3 overflow-hidden"
                >
                  <p className="text-sm font-medium truncate">{user?.name || decodedToken?.email || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{role || 'Guest'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={logout}
                  title={t('common.logout', 'Logout')}
                >
                  <LogOut size={18} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

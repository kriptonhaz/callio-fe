import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard.menu.dashboard'), href: '/dashboard' },
    { icon: Users, label: t('dashboard.menu.clients'), href: '/clients' },
    { icon: Phone, label: t('dashboard.menu.leads'), href: '/leads' },
    { icon: Calendar, label: t('dashboard.menu.appointments'), href: '/appointments' },
    { icon: PieChart, label: t('dashboard.menu.reports'), href: '/reports' },
    { icon: FileText, label: t('dashboard.menu.recordings'), href: '/recordings' },
    { icon: Settings, label: t('dashboard.menu.settings'), href: '/settings' },
  ];

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
            const isActive = location.pathname.startsWith(item.href);
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
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
            JD
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 overflow-hidden"
              >
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">{t('dashboard.user.admin')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

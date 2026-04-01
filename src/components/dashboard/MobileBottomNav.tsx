import { useMemo } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  PieChart,
  Users,
  Activity,
  Menu,
  ClipboardList,
  MessageSquare,
  X,
} from 'lucide-react'
import { GalleryThumbnails } from '@/components/animate-ui/icons/gallery-thumbnails'
import { cn } from '@/lib/utils'
import { decodeJwt } from '@/lib/jwt'
import { getAccessToken } from '@/lib/api/client'
import { useUser } from '@/hooks/api/useUsers'
import { useEnabledServices } from '@/hooks/api/useServices'
import { ServiceType } from '@/lib/api/types/services.types'

interface MobileBottomNavProps {
  onMenuClick: () => void
  isSidebarOpen: boolean
}

export function MobileBottomNav({
  onMenuClick,
  isSidebarOpen,
}: MobileBottomNavProps): React.ReactElement {
  const { t } = useTranslation()
  const location = useLocation()

  // Role determination logic
  const token = getAccessToken()
  const decodedToken = useMemo(() => (token ? decodeJwt(token) : null), [token])
  const userId = decodedToken?.sub
  const jwtRole = decodedToken?.role

  const { data: user } = useUser(userId || '')
  const { data: enabledServices } = useEnabledServices(user?.clientId)

  const hasVoipService = useMemo(() => {
    if (!enabledServices) return false
    return enabledServices.some(
      (service) =>
        service.serviceType === ServiceType.VOICE && service.isEnabled,
    )
  }, [enabledServices])

  const role = user?.role || jwtRole

  const menuItems = useMemo(() => {
    if (role === 'superadmin') {
      return [
        {
          icon: LayoutDashboard,
          label: t('dashboard.menu.dashboard'),
          href: '/dashboard',
        },
        {
          icon: Users,
          label: t('dashboard.menu.client', 'Client'),
          href: '/dashboard/clients',
        },
        {
          icon: Activity,
          label: t('dashboard.menu.log', 'Log'),
          href: '/dashboard/logs',
        },
      ]
    }

    if (role === 'admin' || role === 'supervisor') {
      const items = [
        {
          icon: LayoutDashboard,
          label: t('dashboard.menu.dashboard'),
          href: '/dashboard',
        },
        {
          icon: Calendar,
          label: t('dashboard.menu.campaign', 'Campaign'),
          href: '/dashboard/campaigns',
        },
        {
          icon: PieChart,
          label: t('dashboard.menu.reports', 'Reports'),
          href: '/dashboard/reports',
        },
      ]

      if (hasVoipService) {
        items.push({
          icon: GalleryThumbnails as typeof LayoutDashboard,
          label: t('dashboard.menu.monitoring', 'Monitoring'),
          href: '/dashboard/monitoring',
        })
      }

      return items
    }

    if (role === 'agent') {
      return [
        {
          icon: Calendar,
          label: t('dashboard.menu.campaign', 'Campaign'),
          href: '/dashboard/campaigns',
        },
        {
          icon: ClipboardList,
          label: t('dashboard.menu.leads', 'Leads'),
          href: '/dashboard/leads',
        },
        {
          icon: MessageSquare,
          label: t('dashboard.menu.whatsapp', 'WhatsApp'),
          href: '/dashboard/whatsapp',
        },
      ]
    }

    // Default fallback
    return [
      {
        icon: LayoutDashboard,
        label: t('dashboard.menu.dashboard'),
        href: '/dashboard',
      },
    ]
  }, [role, t, hasVoipService])

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return (
        location.pathname === '/dashboard' ||
        location.pathname === '/dashboard/'
      )
    }
    return location.pathname.startsWith(href)
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {menuItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-1 py-2 transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon
                size={20}
                className={cn(
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-xs mt-1 truncate max-w-full',
                  active && 'font-medium',
                )}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"
                />
              )}
            </Link>
          )
        })}

        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full px-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="text-xs mt-1">{t('common.menu', 'Menu')}</span>
        </button>
      </div>
    </motion.nav>
  )
}

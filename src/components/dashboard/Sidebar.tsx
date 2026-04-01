import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import { useLogout } from '@/hooks/api/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AnimateIcon } from '@/components/animate-ui/icons/icon'
import { LayoutDashboard } from '@/components/animate-ui/icons/layout-dashboard'
import { Users } from '@/components/animate-ui/icons/users'
import { ClipboardList } from '@/components/animate-ui/icons/clipboard-list'
import { PhoneCall } from '@/components/animate-ui/icons/phone-call'
import { Calendar } from '@/components/animate-ui/icons/calendar'
import { PieChart } from '@/components/animate-ui/icons/pie-chart'
import { Settings } from '@/components/animate-ui/icons/settings'
import { Router } from '@/components/animate-ui/icons/router'
import { Activity } from '@/components/animate-ui/icons/activity'
import { ChartLine } from '@/components/animate-ui/icons/chart-line'
import { GalleryThumbnails } from '@/components/animate-ui/icons/gallery-thumbnails'
import { MessageCircleMore } from '@/components/animate-ui/icons/message-circle-more'
import { Radio } from '@/components/animate-ui/icons/radio'
import { useTranslation } from 'react-i18next'
import { decodeJwt } from '@/lib/jwt'
import { getAccessToken } from '@/lib/api/client'
import { useUser } from '@/hooks/api/useUsers'
import { useClient } from '@/hooks/api/useClients'
import { useEnabledServices } from '@/hooks/api/useServices'
import { ServiceType } from '@/lib/api/types/services.types'

import rangcoolLogo from '@/assets/images/rangcool-logo.png'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]) // Default collapsed
  const location = useLocation()
  const { t } = useTranslation()
  const logout = useLogout()

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Close mobile sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen && onMobileClose) {
        onMobileClose()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileOpen, onMobileClose])

  // Role determination logic
  const token = getAccessToken()
  const decodedToken = useMemo(() => (token ? decodeJwt(token) : null), [token])
  const userId = decodedToken?.sub
  const jwtRole = decodedToken?.role

  // Periodically fetch user to verify role (double security)
  const { data: user } = useUser(userId || '', { refetchInterval: 60000 })

  // Fetch client data if user has clientId
  const { data: client } = useClient(user?.clientId || '')

  // Fetch enabled services for the client
  const { data: enabledServices } = useEnabledServices(user?.clientId)

  // Check if VoIP service is enabled
  const hasVoipService = useMemo(() => {
    if (!enabledServices) return false
    return enabledServices.some(
      (service) =>
        service.serviceType === ServiceType.VOICE && service.isEnabled,
    )
  }, [enabledServices])

  // Effective role: prefer API data, fallback to JWT
  const role = user?.role || jwtRole

  const menuItems = useMemo(() => {
    // Dashboard is only for superadmin, admin, supervisor - NOT for agents
    const dashboardItem = {
      icon: LayoutDashboard,
      label: t('dashboard.menu.dashboard'),
      href: '/dashboard',
    }

    // ... existing imports

    if (role === 'superadmin') {
      return [
        dashboardItem,
        {
          icon: Radio,
          label: t('dashboard.menu.broadcast', 'Broadcast'),
          href: '/dashboard/broadcast',
        },
        {
          icon: PhoneCall,
          label: t('dashboard.menu.sipExtensions', 'SIP Extensions'),
          href: '/dashboard/sip-extensions',
        },
        {
          icon: Router,
          label: t('dashboard.menu.gsmDevices', 'GSM Devices'),
          href: '/dashboard/gsm-devices',
        },
        {
          icon: Users,
          label: t('dashboard.menu.internalUser', 'Internal User'),
          href: '/dashboard/internal-user',
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
        {
          icon: Settings,
          label: t('dashboard.menu.settings'),
          href: '/dashboard/settings',
          id: 'settings',
          children: [
            {
              icon: ChartLine,
              label: t('dashboard.menu.defaultPricing', 'Default Pricing'),
              href: '/dashboard/settings/default-pricing',
            },
            {
              icon: Sparkles,
              label: t('dashboard.menu.aiProvider', 'AI Provider'),
              href: '/dashboard/settings/ai-provider',
            },
            {
              icon: Smartphone,
              label: t('dashboard.menu.mobileOperator', 'Mobile Operator'),
              href: '/dashboard/settings/mobile-operator',
            },
          ],
        },
      ]
    }

    if (role === 'admin' || role === 'supervisor') {
      const items = [
        dashboardItem,
        {
          icon: Calendar,
          label: t('dashboard.menu.campaign', 'Campaign'),
          href: '/dashboard/campaigns',
        },
        {
          icon: ClipboardList,
          label: t('dashboard.menu.leads'),
          href: '/dashboard/leads',
        },
        {
          icon: MessageCircleMore,
          label: t('dashboard.menu.whatsapp', 'WhatsApp'),
          href: '/dashboard/whatsapp',
        },
        {
          icon: PieChart,
          label: t('dashboard.menu.reports'),
          href: '/dashboard/reports',
        },
      ]

      // Only show Monitoring if VoIP service is enabled
      if (hasVoipService) {
        items.push({
          icon: GalleryThumbnails,
          label: t('dashboard.menu.monitoring', 'Monitoring'),
          href: '/dashboard/monitoring',
        })
      }

      items.push({
        icon: Settings,
        label: t('dashboard.menu.settings'),
        href: '/dashboard/settings',
      })

      // Only Admin can see Users menu
      if (role === 'admin') {
        items.splice(1, 0, {
          icon: Users,
          label: t('dashboard.menu.users', 'Users'),
          href: '/dashboard/users',
        })
      }

      return items
    }

    if (role === 'agent') {
      // Agents do NOT have access to Dashboard - Campaign is their home
      return [
        {
          icon: Calendar,
          label: t('dashboard.menu.campaign', 'Campaign'),
          href: '/dashboard/campaigns',
        },
        {
          icon: MessageCircleMore,
          label: t('dashboard.menu.whatsapp', 'WhatsApp'),
          href: '/dashboard/whatsapp',
        },
        {
          icon: Settings,
          label: t('dashboard.menu.settings'),
          href: '/dashboard/settings',
        },
      ]
    }

    // Default fallback - includes dashboard for unknown roles
    return [
      dashboardItem,
      ...(hasVoipService
        ? [
            {
              icon: PhoneCall,
              label: t('dashboard.menu.voip', 'VoIP Service'),
              href: '/dashboard/voip',
              children: [
                {
                  label: t('dashboard.menu.callData', 'Call Data'),
                  href: '/dashboard/voip/call-logs',
                },
              ],
            },
          ]
        : []),
      {
        icon: Users,
        label: t('dashboard.menu.leads', 'Leads'),
        href: '/dashboard/leads',
      },
      {
        icon: ClipboardList,
        label: t('dashboard.menu.campaigns', 'Campaigns'),
        href: '/dashboard/campaigns',
      },
      {
        icon: Calendar,
        label: t('dashboard.menu.appointments', 'Appointments'),
        href: '/dashboard/appointments',
      },
      {
        icon: GalleryThumbnails,
        label: t('dashboard.menu.monitoring', 'Monitoring'),
        href: '/dashboard/monitoring',
      },
      {
        icon: ChartLine,
        label: t('dashboard.menu.reports', 'Reports'),
        href: '/dashboard/reports',
      },
      {
        icon: Settings,
        label: t('dashboard.menu.settings', 'Settings'),
        id: 'settings',
        href: '/dashboard/settings',
        children: [
          {
            label: t('dashboard.menu.general', 'General'),
            href: '/dashboard/settings/general',
          },
          {
            label: t('dashboard.menu.users', 'Users'),
            href: '/dashboard/settings/users',
          },
          {
            label: t('dashboard.menu.roles', 'Roles'),
            href: '/dashboard/settings/roles',
          },
          {
            label: t('dashboard.menu.pricing', 'Pricing'),
            href: '/dashboard/settings/default-pricing',
          },
          {
            label: t('dashboard.menu.mobileOperator', 'Mobile Operator'),
            href: '/dashboard/settings/mobile-operator',
          },
        ],
      },
    ]
  }, [role, t, hasVoipService])

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(
      (prev) =>
        prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [menuId], // Only keep this menu expanded, collapse others
    )
  }

  // Collapse all expandable menus when clicking a non-expandable item
  const collapseAllMenus = () => {
    setExpandedMenus([])
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {/* Desktop sidebar - always visible */}
        <motion.div
          initial={{ width: 256 }}
          animate={{ width: isCollapsed ? 80 : 256 }}
          className="h-full bg-card border-r border-border relative flex-col shadow-sm z-10 hidden md:flex"
        >
          {renderSidebarContent()}
        </motion.div>

        {/* Mobile sidebar - overlay */}
        {isMobileOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col shadow-lg z-[60] md:hidden"
          >
            {renderSidebarContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  function renderSidebarContent() {
    return (
      <>
        <div
          className={cn(
            'p-4 flex items-center border-b border-border h-16 transition-all',
            isCollapsed ? 'justify-center gap-1 px-2' : 'justify-between',
          )}
        >
          <motion.div
            layout
            className={cn(
              'flex items-center',
              isCollapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <img
              src={rangcoolLogo}
              alt="RangCool"
              className={cn(
                'object-contain transition-all',
                isCollapsed ? 'h-6 w-auto' : 'h-8 w-auto',
              )}
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-xl text-primary tracking-tight whitespace-nowrap"
                >
                  RangCool
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto shrink-0"
            >
              <ChevronLeft size={18} />
            </Button>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronRight size={14} />
            </Button>
          )}
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {menuItems.map((item: any) => {
              const isActive =
                item.href === '/dashboard'
                  ? location.pathname === '/dashboard' ||
                    location.pathname === '/dashboard/'
                  : location.pathname.startsWith(item.href)
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = item.id
                ? expandedMenus.includes(item.id)
                : false

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    // Expandable menu item
                    <div>
                      <AnimateIcon animateOnHover asChild>
                        <div
                          onClick={() => item.id && toggleMenu(item.id)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-md transition-colors group relative overflow-hidden cursor-pointer text-sm',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              size={18}
                              className={cn(
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground group-hover:text-foreground',
                              )}
                            />
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
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{
                                  opacity: 1,
                                  rotate: isExpanded ? 180 : 0,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={16} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </AnimateIcon>
                      {/* Children submenu */}
                      <AnimatePresence>
                        {isExpanded && !isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4 mt-1"
                          >
                            {item.children.map((child: any) => {
                              const childIsActive =
                                location.pathname.startsWith(child.href)
                              return (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className="block"
                                >
                                  <div
                                    className={cn(
                                      'flex items-center px-3 py-1.5 rounded-md transition-colors group relative overflow-hidden cursor-pointer text-sm',
                                      childIsActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                  >
                                    <child.icon
                                      size={16}
                                      className={cn(
                                        childIsActive
                                          ? 'text-primary'
                                          : 'text-muted-foreground group-hover:text-foreground',
                                      )}
                                    />
                                    <span className="ml-3 whitespace-nowrap">
                                      {child.label}
                                    </span>
                                    {childIsActive && (
                                      <motion.div
                                        layoutId="active-pill-child"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                      />
                                    )}
                                  </div>
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    // Regular menu item
                    <Link
                      to={item.href}
                      className="block"
                      onClick={collapseAllMenus}
                    >
                      <AnimateIcon animateOnHover asChild>
                        <div
                          className={cn(
                            'flex items-center px-3 py-2 rounded-md transition-colors group relative overflow-hidden cursor-pointer text-sm',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              size={18}
                              className={cn(
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground group-hover:text-foreground',
                              )}
                            />
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
                  )}
                </div>
              )
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
                    <p className="text-sm font-medium truncate">
                      {user?.name || decodedToken?.email || 'User'}
                    </p>

                    {client && (
                      <p className="text-xs text-primary font-medium truncate mt-0.5">
                        {client.name}
                      </p>
                    )}
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
      </>
    )
  }
}

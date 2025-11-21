import { Box, Flex, IconButton, Text, VStack } from "@chakra-ui/react"
import { useStore } from "@tanstack/react-store"
import { Link, useRouterState } from "@tanstack/react-router"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Megaphone,
  UserCircle,
  Headphones,
  Mic,
  BarChart3,
  Server,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { uiStore, toggleSidebar } from "../../lib/ui-store"

const MotionBox = motion.create(Box)

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  roles?: string[]
}

export function Sidebar() {
  const { t } = useTranslation()
  const sidebarCollapsed = useStore(uiStore, (state) => state.sidebarCollapsed)
  const router = useRouterState()
  const currentPath = router.location.pathname

  // For demo purposes, we'll show all menu items
  // In production, filter by user role
  const navItems: NavItem[] = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, path: "/" },
    { label: t("nav.clients"), icon: Users, path: "/super-admin/clients" },
    { label: t("nav.monitoring"), icon: Server, path: "/super-admin/monitoring" },
    { label: t("nav.campaigns"), icon: Megaphone, path: "/admin/campaigns" },
    { label: t("nav.leads"), icon: UserCircle, path: "/admin/leads" },
    { label: t("nav.agents"), icon: Headphones, path: "/admin/agents" },
    { label: t("nav.recordings"), icon: Mic, path: "/admin/recordings" },
    { label: t("nav.reports"), icon: BarChart3, path: "/admin/reports" },
    { label: t("nav.myLeads"), icon: UserCircle, path: "/agent/leads" },
    { label: t("nav.appointments"), icon: Calendar, path: "/agent/appointments" },
    { label: t("nav.settings"), icon: Settings, path: "/agent/settings" },
  ]

  return (
    <Box
      as="nav"
      pos="fixed"
      left={0}
      top={0}
      h="100vh"
      w={sidebarCollapsed ? "60px" : "240px"}
      bg="secondary.solid"
      color="white"
      transition="width 0.2s"
      zIndex={1000}
      overflowY="auto"
      css={{
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "4px",
        },
      }}
    >
      <Flex h="60px" align="center" justify="space-between" px={4} borderBottomWidth="1px" borderColor="whiteAlpha.200">
        {!sidebarCollapsed && (
          <Text fontSize="xl" fontWeight="bold" color="primary.400">
            {t("app.name")}
          </Text>
        )}
        <IconButton
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          variant="ghost"
          colorPalette="whiteAlpha"
          size="sm"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </IconButton>
      </Flex>

      <VStack gap={1} py={4} align="stretch">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/")

          return (
            <Link key={item.path} to={item.path}>
              <MotionBox
                as="button"
                w="full"
                px={4}
                py={3}
                display="flex"
                alignItems="center"
                gap={3}
                bg={isActive ? "whiteAlpha.200" : "transparent"}
                color={isActive ? "primary.400" : "whiteAlpha.900"}
                borderLeftWidth="3px"
                borderLeftColor={isActive ? "primary.400" : "transparent"}
                _hover={{
                  bg: "whiteAlpha.100",
                  color: "primary.300",
                }}
                transition={{ duration: 0.2 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={20} />
                {!sidebarCollapsed && (
                  <Text fontSize="sm" fontWeight="medium">
                    {item.label}
                  </Text>
                )}
              </MotionBox>
            </Link>
          )
        })}
      </VStack>
    </Box>
  )
}


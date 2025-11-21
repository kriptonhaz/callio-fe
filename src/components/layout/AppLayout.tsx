import { Box, Container } from "@chakra-ui/react"
import { useStore } from "@tanstack/react-store"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { uiStore } from "../../lib/ui-store"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarCollapsed = useStore(uiStore, (state) => state.sidebarCollapsed)

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Sidebar />
      <Box
        ml={{ base: 0, md: sidebarCollapsed ? "60px" : "240px" }}
        transition="margin-left 0.2s"
      >
        <TopNav />
        <Container maxW="container.2xl" py={6}>
          {children}
        </Container>
      </Box>
    </Box>
  )
}

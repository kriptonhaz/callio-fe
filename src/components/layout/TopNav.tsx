import {
  Box,
  Flex,
  IconButton,
  Menu,
  Text,
} from "@chakra-ui/react"
import { useStore } from "@tanstack/react-store"
import { Moon, Sun, Globe, User, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { uiStore, toggleTheme, setLanguage } from "../../lib/ui-store"
import { Breadcrumbs } from "./Breadcrumbs"

export function TopNav() {
  const { t, i18n } = useTranslation()
  const themeMode = useStore(uiStore, (state) => state.themeMode)
  const language = useStore(uiStore, (state) => state.language)

  const handleLanguageChange = (lang: "en" | "id") => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <Box
      as="header"
      h="60px"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderColor="border.default"
      px={6}
    >
      <Flex h="full" align="center" justify="space-between">
        <Breadcrumbs />

        <Flex gap={2} align="center">
          {/* Theme Toggle */}
          <IconButton
            aria-label="Toggle theme"
            onClick={toggleTheme}
            variant="ghost"
            size="sm"
          >
            {themeMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>

          {/* Language Selector */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="Change language"
                variant="ghost"
                size="sm"
              >
                <Globe size={18} />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  value="en"
                  onClick={() => handleLanguageChange("en")}
                  bg={language === "en" ? "bg.subtle" : undefined}
                >
                  English
                </Menu.Item>
                <Menu.Item
                  value="id"
                  onClick={() => handleLanguageChange("id")}
                  bg={language === "id" ? "bg.subtle" : undefined}
                >
                  Bahasa Indonesia
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>

          {/* User Menu */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="User menu"
                variant="ghost"
                size="sm"
              >
                <User size={18} />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="profile">
                  <Flex align="center" gap={2}>
                    <User size={16} />
                    <Text>{t("nav.profile")}</Text>
                  </Flex>
                </Menu.Item>
                <Menu.Item value="settings">
                  <Text>{t("nav.settings")}</Text>
                </Menu.Item>
                <Menu.Item value="logout">
                  <Flex align="center" gap={2} color="red.500">
                    <LogOut size={16} />
                    <Text>{t("nav.logout")}</Text>
                  </Flex>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Flex>
      </Flex>
    </Box>
  )
}


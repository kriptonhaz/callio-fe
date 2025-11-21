import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Heading, VStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useStore } from "@tanstack/react-store"
import { PageHeader } from "../../components/shared/PageHeader"
import { uiStore, toggleTheme, setLanguage } from "../../lib/ui-store"

export const Route = createFileRoute("/agent/settings")({
  component: AgentSettingsPage,
})


function AgentSettingsPage() {
  const { t, i18n } = useTranslation()
  const themeMode = useStore(uiStore, (state) => state.themeMode)
  const language = useStore(uiStore, (state) => state.language)

  const handleLanguageChange = (lang: "en" | "id") => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <Box>
      <PageHeader
        title={t("settings.title")}
        description="Manage your account settings"
      />

      <VStack gap={6} align="stretch" maxW="2xl">
        <Box p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
          <Heading size="md" mb={4}>{t("settings.theme")}</Heading>
          <Flex gap={3}>
            <Button
              variant={themeMode === "light" ? "solid" : "outline"}
              colorPalette="primary"
              onClick={() => themeMode === "dark" && toggleTheme()}
            >
              {t("settings.light")}
            </Button>
            <Button
              variant={themeMode === "dark" ? "solid" : "outline"}
              colorPalette="primary"
              onClick={() => themeMode === "light" && toggleTheme()}
            >
              {t("settings.dark")}
            </Button>
          </Flex>
        </Box>

        <Box p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
          <Heading size="md" mb={4}>{t("settings.language")}</Heading>
          <Flex gap={3}>
            <Button
              variant={language === "en" ? "solid" : "outline"}
              colorPalette="primary"
              onClick={() => handleLanguageChange("en")}
            >
              English
            </Button>
            <Button
              variant={language === "id" ? "solid" : "outline"}
              colorPalette="primary"
              onClick={() => handleLanguageChange("id")}
            >
              Bahasa Indonesia
            </Button>
          </Flex>
        </Box>

        <Box p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
          <Heading size="md" mb={4}>{t("settings.profile")}</Heading>
          <Text color="gray.600">Profile settings will be available here.</Text>
        </Box>

        <Box p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
          <Heading size="md" mb={4}>{t("settings.password")}</Heading>
          <Text color="gray.600">Password change form will be available here.</Text>
        </Box>
      </VStack>
    </Box>
  )
}

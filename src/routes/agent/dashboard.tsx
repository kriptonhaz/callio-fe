import { createFileRoute } from "@tanstack/react-router"
import { Box, Heading, Text, SimpleGrid, Card, Flex } from "@chakra-ui/react"
import { Phone, TrendingUp, Clock, Calendar } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "../../components/shared/PageHeader"

export const Route = createFileRoute("/agent/dashboard")({
  component: AgentDashboardPage,
})


function AgentDashboardPage() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t("agents.callsToday"),
      value: "24",
      icon: Phone,
      color: "blue.500",
    },
    {
      title: t("agents.conversionRate"),
      value: "32%",
      icon: TrendingUp,
      color: "green.500",
    },
    {
      title: t("agents.avgTalkTime"),
      value: "4:32",
      icon: Clock,
      color: "orange.500",
    },
    {
      title: "Appointments Today",
      value: "3",
      icon: Calendar,
      color: "purple.500",
    },
  ]

  return (
    <Box>
      <PageHeader
        title={t("dashboard.welcome")}
        description="Your performance overview"
      />

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card.Root key={stat.title}>
              <Card.Body>
                <Flex justify="space-between" align="start">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      {stat.title}
                    </Text>
                    <Heading size="xl">{stat.value}</Heading>
                  </Box>
                  <Box p={3} bg={stat.color} borderRadius="lg" color="white">
                    <Icon size={24} />
                  </Box>
                </Flex>
              </Card.Body>
            </Card.Root>
          )
        })}
      </SimpleGrid>

      <Box p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
        <Heading size="lg" mb={4}>
          {t("dashboard.recentActivity")}
        </Heading>
        <Text color="gray.600">
          Your recent calls and activities will be displayed here.
        </Text>
      </Box>
    </Box>
  )
}

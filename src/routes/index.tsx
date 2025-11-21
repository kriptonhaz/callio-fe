import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text, SimpleGrid, Card, Flex } from '@chakra-ui/react'
import { Users, Megaphone, UserCircle, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t('nav.clients'),
      value: '12',
      icon: Users,
      color: 'blue.500',
    },
    {
      title: t('nav.campaigns'),
      value: '8',
      icon: Megaphone,
      color: 'green.500',
    },
    {
      title: t('nav.leads'),
      value: '156',
      icon: UserCircle,
      color: 'orange.500',
    },
    {
      title: 'Conversion Rate',
      value: '24%',
      icon: TrendingUp,
      color: 'purple.500',
    },
  ]

  return (
    <Box>
      <Box mb={8}>
        <Heading size="2xl" mb={2}>
          {t('dashboard.welcome')}
        </Heading>
        <Text color="gray.600">{t('app.tagline')}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
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

      <Box mt={8} p={6} bg="bg.surface" borderRadius="lg">
        <Heading size="lg" mb={4}>
          {t('dashboard.overview')}
        </Heading>
        <Text color="gray.600">
          Welcome to Callio! This is your dashboard where you can monitor all your call center operations.
          Use the sidebar to navigate to different sections.
        </Text>
      </Box>
    </Box>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Heading, Text, Tabs, Spinner } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { Edit, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useClient, useDeleteClient } from "../../../../hooks/useClients"
import { PageHeader } from "../../../../components/shared/PageHeader"
import { StatusBadge } from "../../../../components/shared/StatusBadge"
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog"
import { useState } from "react"


export const Route = createFileRoute("/super-admin/clients/$clientId/")({
  component: ClientDetailPage,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const { t } = useTranslation()
  const { data: client, isLoading } = useClient(clientId)
  const deleteClient = useDeleteClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClient.mutateAsync(clientId)
      // Navigate back to list after deletion
      window.location.href = "/super-admin/clients"
    } catch (error) {
      console.error("Failed to delete client:", error)
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="primary.500" />
      </Flex>
    )
  }

  if (!client) {
    return (
      <Box>
        <PageHeader title={t("errors.notFound")} />
        <Text>Client not found</Text>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title={client.name}
        description={t("clients.detail")}
        action={
          <Flex gap={2}>
            <Link to="/super-admin/clients/$clientId/edit" params={{ clientId }}>
              <Button variant="outline" size="sm">
                <Edit size={16} />
                {t("common.edit")}
              </Button>
            </Link>
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" colorPalette="red">
                  <Trash2 size={16} />
                  {t("common.delete")}
                </Button>
              }
              title={t("clients.deleteConfirm")}
              message={`Are you sure you want to delete ${client.name}? This action cannot be undone.`}
              onConfirm={handleDelete}
              isLoading={isDeleting}
            />
          </Flex>
        }
      />

      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">{t("clients.tabs.overview")}</Tabs.Trigger>
          <Tabs.Trigger value="payments">{t("clients.tabs.payments")}</Tabs.Trigger>
          <Tabs.Trigger value="users">{t("clients.tabs.users")}</Tabs.Trigger>
          <Tabs.Trigger value="activity">{t("clients.tabs.activity")}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <Box mt={6} p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
            <Heading size="md" mb={4}>Client Information</Heading>
            
            <Flex direction="column" gap={4}>
              <Flex justify="space-between">
                <Text fontWeight="medium" color="gray.600">{t("clients.name")}:</Text>
                <Text>{client.name}</Text>
              </Flex>

              <Flex justify="space-between">
                <Text fontWeight="medium" color="gray.600">{t("clients.email")}:</Text>
                <Text>{client.email}</Text>
              </Flex>

              {client.phone && (
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">{t("clients.phone")}:</Text>
                  <Text>{client.phone}</Text>
                </Flex>
              )}

              {client.domain && (
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">{t("clients.domain")}:</Text>
                  <Text>{client.domain}</Text>
                </Flex>
              )}

              {client.contactPerson && (
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">{t("clients.contactPerson")}:</Text>
                  <Text>{client.contactPerson}</Text>
                </Flex>
              )}

              <Flex justify="space-between">
                <Text fontWeight="medium" color="gray.600">{t("common.status")}:</Text>
                <StatusBadge status={client.status} />
              </Flex>

              {client.billingPlan && (
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">{t("clients.billingPlan")}:</Text>
                  <Text>{client.billingPlan}</Text>
                </Flex>
              )}

              {client.billingCycle && (
                <Flex justify="space-between">
                  <Text fontWeight="medium" color="gray.600">{t("clients.billingCycle")}:</Text>
                  <Text>{client.billingCycle}</Text>
                </Flex>
              )}

              {client.notes && (
                <Box>
                  <Text fontWeight="medium" color="gray.600" mb={2}>{t("clients.notes")}:</Text>
                  <Text>{client.notes}</Text>
                </Box>
              )}

              <Flex justify="space-between">
                <Text fontWeight="medium" color="gray.600">{t("clients.createdAt")}:</Text>
                <Text>{new Date(client.createdAt).toLocaleDateString()}</Text>
              </Flex>
            </Flex>
          </Box>
        </Tabs.Content>

        <Tabs.Content value="payments">
          <Box mt={6} p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
            <Heading size="md" mb={4}>{t("clients.tabs.payments")}</Heading>
            <Text color="gray.600">Payment history will be displayed here.</Text>
          </Box>
        </Tabs.Content>

        <Tabs.Content value="users">
          <Box mt={6} p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
            <Heading size="md" mb={4}>{t("clients.tabs.users")}</Heading>
            <Text color="gray.600">Client users will be displayed here.</Text>
          </Box>
        </Tabs.Content>

        <Tabs.Content value="activity">
          <Box mt={6} p={6} bg="bg.surface" borderRadius="lg" borderWidth="1px">
            <Heading size="md" mb={4}>{t("clients.tabs.activity")}</Heading>
            <Text color="gray.600">Activity log will be displayed here.</Text>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Table, Spinner } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useClients } from "../../../hooks/useClients"
import { PageHeader } from "../../../components/shared/PageHeader"
import { StatusBadge } from "../../../components/shared/StatusBadge"
import { EmptyState } from "../../../components/shared/EmptyState"

export const Route = createFileRoute("/super-admin/clients/")({
  component: ClientsListPage,
})

function ClientsListPage() {
  const { t } = useTranslation()
  const { data: clients, isLoading } = useClients()

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="primary.500" />
      </Flex>
    )
  }

  return (
    <Box>
      <PageHeader
        title={t("clients.title")}
        description={t("clients.list")}
        action={
          <Link to="/super-admin/clients/create">
            <Button colorPalette="primary">
              <Plus size={18} />
              {t("clients.create")}
            </Button>
          </Link>
        }
      />

      {!clients || clients.length === 0 ? (
        <EmptyState
          title={t("common.noData")}
          description="No clients found. Create your first client to get started."
          action={
            <Link to="/super-admin/clients/create">
              <Button colorPalette="primary">
                <Plus size={18} />
                {t("clients.create")}
              </Button>
            </Link>
          }
        />
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("clients.name")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("clients.email")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("clients.phone")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.status")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("clients.billingPlan")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {clients.map((client) => (
              <Table.Row key={client.id}>
                <Table.Cell fontWeight="medium">{client.name}</Table.Cell>
                <Table.Cell>{client.email}</Table.Cell>
                <Table.Cell>{client.phone || "-"}</Table.Cell>
                <Table.Cell>
                  <StatusBadge status={client.status} />
                </Table.Cell>
                <Table.Cell>{client.billingPlan || "-"}</Table.Cell>
                <Table.Cell>
                  <Link to="/super-admin/clients/$clientId" params={{ clientId: client.id }}>
                    <Button size="sm" variant="ghost">
                      {t("common.view")}
                    </Button>
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}

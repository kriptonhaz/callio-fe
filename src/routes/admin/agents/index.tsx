import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Table, Spinner } from "@chakra-ui/react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAgents } from "../../../hooks/useAgents"
import { PageHeader } from "../../../components/shared/PageHeader"
import { EmptyState } from "../../../components/shared/EmptyState"

export const Route = createFileRoute("/admin/agents/")({
  component: AgentsListPage,
})

function AgentsListPage() {
  const { t } = useTranslation()
  const { data: agents, isLoading } = useAgents()

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
        title={t("agents.title")}
        description={t("agents.list")}
        action={
          <Button colorPalette="primary" disabled>
            <Plus size={18} />
            {t("agents.create")} (Coming Soon)
          </Button>
        }
      />

      {!agents || agents.length === 0 ? (
        <EmptyState
          title={t("common.noData")}
          description="No agents found. Create your first agent to get started."
          action={
            <Button colorPalette="primary" disabled>
              <Plus size={18} />
              {t("agents.create")} (Coming Soon)
            </Button>
          }
        />
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("agents.name")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("agents.email")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("agents.phone")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("agents.createdAt")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {agents.map((agent) => (
              <Table.Row key={agent.id}>
                <Table.Cell fontWeight="medium">{agent.name}</Table.Cell>
                <Table.Cell>{agent.email}</Table.Cell>
                <Table.Cell>{agent.phone || "-"}</Table.Cell>
                <Table.Cell>{new Date(agent.createdAt).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Button size="sm" variant="ghost" disabled>
                    {t("common.view")}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Table, Spinner } from "@chakra-ui/react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCampaigns } from "../../../hooks/useCampaigns"
import { PageHeader } from "../../../components/shared/PageHeader"
import { StatusBadge } from "../../../components/shared/StatusBadge"
import { EmptyState } from "../../../components/shared/EmptyState"

export const Route = createFileRoute("/admin/campaigns/")({
  component: CampaignsListPage,
})

function CampaignsListPage() {
  const { t } = useTranslation()
  const { data: campaigns, isLoading } = useCampaigns()

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
        title={t("campaigns.title")}
        description={t("campaigns.list")}
        action={
          <Button colorPalette="primary" disabled>
            <Plus size={18} />
            {t("campaigns.create")} (Coming Soon)
          </Button>
        }
      />

      {!campaigns || campaigns.length === 0 ? (
        <EmptyState
          title={t("common.noData")}
          description="No campaigns found. Create your first campaign to get started."
          action={
            <Button colorPalette="primary" disabled>
              <Plus size={18} />
              {t("campaigns.create")} (Coming Soon)
            </Button>
          }
        />
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("campaigns.name")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("campaigns.startDate")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("campaigns.endDate")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.status")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("campaigns.assignedAgents")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {campaigns.map((campaign) => (
              <Table.Row key={campaign.id}>
                <Table.Cell fontWeight="medium">{campaign.name}</Table.Cell>
                <Table.Cell>{new Date(campaign.startDate).toLocaleDateString()}</Table.Cell>
                <Table.Cell>{new Date(campaign.endDate).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <StatusBadge status={campaign.status} />
                </Table.Cell>
                <Table.Cell>{campaign.assignedAgents.length} agents</Table.Cell>
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

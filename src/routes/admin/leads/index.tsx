import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Table, Spinner, Input } from "@chakra-ui/react"
import { Plus } from "lucide-react"

import { useTranslation } from "react-i18next"
import { useLeads } from "../../../hooks/useLeads"
import { PageHeader } from "../../../components/shared/PageHeader"
import { StatusBadge } from "../../../components/shared/StatusBadge"
import { EmptyState } from "../../../components/shared/EmptyState"
import { useState } from "react"

export const Route = createFileRoute("/admin/leads/")({
  component: LeadsListPage,
})

function LeadsListPage() {
  const { t } = useTranslation()
  const { data: leads, isLoading } = useLeads()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLeads = leads?.filter((lead) =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone.includes(searchQuery) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        title={t("leads.title")}
        description={t("leads.list")}
        action={
          <Button colorPalette="primary" disabled>
            <Plus size={18} />
            {t("leads.create")} (Coming Soon)
          </Button>
        }
      />

      <Box mb={4}>
        <Input
          placeholder={t("common.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxW="md"
        />
      </Box>

      {!filteredLeads || filteredLeads.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No leads found" : t("common.noData")}
          description={searchQuery ? "Try adjusting your search" : "No leads found. Create your first lead to get started."}
          action={
            !searchQuery ? (
              <Button colorPalette="primary" disabled>
                <Plus size={18} />
                {t("leads.create")} (Coming Soon)
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("leads.name")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("leads.phone")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("leads.email")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.status")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("leads.source")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("leads.tags")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredLeads.map((lead) => (
              <Table.Row key={lead.id}>
                <Table.Cell fontWeight="medium">{lead.name}</Table.Cell>
                <Table.Cell>{lead.phone}</Table.Cell>
                <Table.Cell>{lead.email || "-"}</Table.Cell>
                <Table.Cell>
                  <StatusBadge status={lead.status} />
                </Table.Cell>
                <Table.Cell>{lead.source || "-"}</Table.Cell>
                <Table.Cell>{lead.tags.join(", ") || "-"}</Table.Cell>
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

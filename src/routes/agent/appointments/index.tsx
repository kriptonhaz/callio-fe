import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Flex, Table, Spinner } from "@chakra-ui/react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppointments } from "../../../hooks/useAppointments"
import { PageHeader } from "../../../components/shared/PageHeader"
import { EmptyState } from "../../../components/shared/EmptyState"

export const Route = createFileRoute("/agent/appointments/")({
  component: AppointmentsListPage,
})

function AppointmentsListPage() {
  const { t } = useTranslation()
  const { data: appointments, isLoading } = useAppointments()

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
        title={t("appointments.title")}
        description={t("appointments.list")}
        action={
          <Button colorPalette="primary" disabled>
            <Plus size={18} />
            {t("appointments.create")} (Coming Soon)
          </Button>
        }
      />

      {!appointments || appointments.length === 0 ? (
        <EmptyState
          title={t("common.noData")}
          description="No appointments found. Create your first appointment to get started."
          action={
            <Button colorPalette="primary" disabled>
              <Plus size={18} />
              {t("appointments.create")} (Coming Soon)
            </Button>
          }
        />
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("appointments.datetime")}</Table.ColumnHeader>
              <Table.ColumnHeader>Lead</Table.ColumnHeader>
              <Table.ColumnHeader>Agent</Table.ColumnHeader>
              <Table.ColumnHeader>{t("appointments.notes")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("common.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {appointments.map((appointment) => (
              <Table.Row key={appointment.id}>
                <Table.Cell fontWeight="medium">
                  {new Date(appointment.datetime).toLocaleString()}
                </Table.Cell>
                <Table.Cell>{appointment.leadId}</Table.Cell>
                <Table.Cell>{appointment.agentId}</Table.Cell>
                <Table.Cell>{appointment.notes || "-"}</Table.Cell>
                <Table.Cell>
                  <Button size="sm" variant="ghost" disabled>
                    {t("common.edit")}
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

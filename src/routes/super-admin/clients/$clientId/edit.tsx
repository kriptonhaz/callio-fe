import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Box, Button, Flex, Input, Select, Textarea, VStack, Spinner, createListCollection } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { PageHeader } from "../../../../components/shared/PageHeader"
import { clientSchema, type ClientFormData } from "../../../../lib/schemas"
import { useClient, useUpdateClient } from "../../../../hooks/useClients"
import { Field } from "@chakra-ui/react"

const statusOptions = createListCollection({
  items: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
})

export const Route = createFileRoute("/super-admin/clients/$clientId/edit")({
  component: EditClientPage,
})

function EditClientPage() {
  const { clientId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: client, isLoading } = useClient(clientId)
  const updateClient = useUpdateClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    values: client ? {
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      domain: client.domain || "",
      contactPerson: client.contactPerson || "",
      status: client.status,
      billingPlan: client.billingPlan || "",
      billingCycle: client.billingCycle || "",
      notes: client.notes || "",
    } : undefined,
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      await updateClient.mutateAsync({ id: clientId, data })
      navigate({ to: "/super-admin/clients/$clientId", params: { clientId } })
    } catch (error) {
      console.error("Failed to update client:", error)
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
    return <Box><PageHeader title={t("errors.notFound")} /></Box>
  }

  return (
    <Box>
      <PageHeader
        title={t("clients.edit")}
        description={`Edit ${client.name}`}
      />

      <Box maxW="2xl" bg="bg.surface" p={6} borderRadius="lg" borderWidth="1px">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!errors.name}>
              <Field.Label>{t("clients.name")} *</Field.Label>
              <Input {...register("name")} />
              {errors.name && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.email}>
              <Field.Label>{t("clients.email")} *</Field.Label>
              <Input {...register("email")} type="email" />
              {errors.email && <Field.ErrorText>{errors.email.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.phone}>
              <Field.Label>{t("clients.phone")}</Field.Label>
              <Input {...register("phone")} />
              {errors.phone && <Field.ErrorText>{errors.phone.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.domain}>
              <Field.Label>{t("clients.domain")}</Field.Label>
              <Input {...register("domain")} />
              {errors.domain && <Field.ErrorText>{errors.domain.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.contactPerson}>
              <Field.Label>{t("clients.contactPerson")}</Field.Label>
              <Input {...register("contactPerson")} />
              {errors.contactPerson && <Field.ErrorText>{errors.contactPerson.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.status}>
              <Field.Label>{t("common.status")} *</Field.Label>
              <Select.Root
                collection={statusOptions}
                value={[client.status]}
                onValueChange={(e) => setValue("status", e.value[0] as "active" | "inactive")}
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.Content>
                  {statusOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {errors.status && <Field.ErrorText>{errors.status.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.billingPlan}>
              <Field.Label>{t("clients.billingPlan")}</Field.Label>
              <Input {...register("billingPlan")} />
              {errors.billingPlan && <Field.ErrorText>{errors.billingPlan.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.billingCycle}>
              <Field.Label>{t("clients.billingCycle")}</Field.Label>
              <Input {...register("billingCycle")} />
              {errors.billingCycle && <Field.ErrorText>{errors.billingCycle.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.notes}>
              <Field.Label>{t("clients.notes")}</Field.Label>
              <Textarea {...register("notes")} rows={4} />
              {errors.notes && <Field.ErrorText>{errors.notes.message}</Field.ErrorText>}
            </Field.Root>

            <Flex gap={3} justify="flex-end" mt={4}>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/super-admin/clients/$clientId", params: { clientId } })}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                colorPalette="primary"
                loading={isSubmitting}
              >
                {t("common.save")}
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}

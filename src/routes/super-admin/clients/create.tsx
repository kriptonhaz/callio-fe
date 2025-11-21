import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Box, Button, Flex, Input, Select, Textarea, VStack, createListCollection } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { PageHeader } from "../../../components/shared/PageHeader"
import { clientSchema, type ClientFormData } from "../../../lib/schemas"
import { useCreateClient } from "../../../hooks/useClients"
import { Field } from "@chakra-ui/react"

const statusOptions = createListCollection({
  items: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
})

export const Route = createFileRoute("/super-admin/clients/create")({
  component: CreateClientPage,
})

function CreateClientPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createClient = useCreateClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: "active",
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      const client = await createClient.mutateAsync(data)
      navigate({ to: "/super-admin/clients/$clientId", params: { clientId: client.id } })
    } catch (error) {
      console.error("Failed to create client:", error)
    }
  }

  return (
    <Box>
      <PageHeader
        title={t("clients.create")}
        description="Create a new client account"
      />

      <Box maxW="2xl" bg="bg.surface" p={6} borderRadius="lg" borderWidth="1px">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!errors.name}>
              <Field.Label>{t("clients.name")} *</Field.Label>
              <Input {...register("name")} placeholder="Enter client name" />
              {errors.name && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.email}>
              <Field.Label>{t("clients.email")} *</Field.Label>
              <Input {...register("email")} type="email" placeholder="client@example.com" />
              {errors.email && <Field.ErrorText>{errors.email.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.phone}>
              <Field.Label>{t("clients.phone")}</Field.Label>
              <Input {...register("phone")} placeholder="+62812345678" />
              {errors.phone && <Field.ErrorText>{errors.phone.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.domain}>
              <Field.Label>{t("clients.domain")}</Field.Label>
              <Input {...register("domain")} placeholder="example.com" />
              {errors.domain && <Field.ErrorText>{errors.domain.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.contactPerson}>
              <Field.Label>{t("clients.contactPerson")}</Field.Label>
              <Input {...register("contactPerson")} placeholder="John Doe" />
              {errors.contactPerson && <Field.ErrorText>{errors.contactPerson.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.status}>
              <Field.Label>{t("common.status")} *</Field.Label>
              <Select.Root
                collection={statusOptions}
                defaultValue={["active"]}
                onValueChange={(e) => setValue("status", e.value[0] as "active" | "inactive")}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Select status" />
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
              <Input {...register("billingPlan")} placeholder="Pro, Starter, Enterprise" />
              {errors.billingPlan && <Field.ErrorText>{errors.billingPlan.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.billingCycle}>
              <Field.Label>{t("clients.billingCycle")}</Field.Label>
              <Input {...register("billingCycle")} placeholder="Monthly, Yearly" />
              {errors.billingCycle && <Field.ErrorText>{errors.billingCycle.message}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!errors.notes}>
              <Field.Label>{t("clients.notes")}</Field.Label>
              <Textarea {...register("notes")} placeholder="Additional notes..." rows={4} />
              {errors.notes && <Field.ErrorText>{errors.notes.message}</Field.ErrorText>}
            </Field.Root>

            <Flex gap={3} justify="flex-end" mt={4}>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/super-admin/clients" })}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                colorPalette="primary"
                loading={isSubmitting}
              >
                {t("common.create")}
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Appointments } from "../lib/mockDb"
import type { AppointmentFormData } from "../lib/schemas"


export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: string) => [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
}

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return Appointments.getAll()
    },
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const appointment = Appointments.getById(id)
      if (!appointment) throw new Error("Appointment not found")
      return appointment
    },
    enabled: !!id,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return Appointments.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AppointmentFormData> }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated = Appointments.update(id, data)
      if (!updated) throw new Error("Appointment not found")
      return updated
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(data.id) })
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const deleted = Appointments.delete(id)
      if (!deleted) throw new Error("Appointment not found")
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
    },
  })
}

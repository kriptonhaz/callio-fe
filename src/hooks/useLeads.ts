import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Leads } from "../lib/mockDb"
import type { LeadFormData } from "../lib/schemas"


export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (filters: string) => [...leadKeys.lists(), { filters }] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
}

export function useLeads() {
  return useQuery({
    queryKey: leadKeys.lists(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return Leads.getAll()
    },
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const lead = Leads.getById(id)
      if (!lead) throw new Error("Lead not found")
      return lead
    },
    enabled: !!id,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LeadFormData & { clientId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return Leads.create({
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadFormData> }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated = Leads.update(id, data)
      if (!updated) throw new Error("Lead not found")
      return updated
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const deleted = Leads.delete(id)
      if (!deleted) throw new Error("Lead not found")
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Campaigns } from "../lib/mockDb"
import type { CampaignFormData } from "../lib/schemas"


export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (filters: string) => [...campaignKeys.lists(), { filters }] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
}

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.lists(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return Campaigns.getAll()
    },
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const campaign = Campaigns.getById(id)
      if (!campaign) throw new Error("Campaign not found")
      return campaign
    },
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CampaignFormData & { clientId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return Campaigns.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignFormData> }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated = Campaigns.update(id, data)
      if (!updated) throw new Error("Campaign not found")
      return updated
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const deleted = Campaigns.delete(id)
      if (!deleted) throw new Error("Campaign not found")
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
    },
  })
}

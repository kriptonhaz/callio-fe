import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Agents } from "../lib/mockDb"
import type { AgentFormData } from "../lib/schemas"

export const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: (filters: string) => [...agentKeys.lists(), { filters }] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
}

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.lists(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return Agents.getAll()
    },
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const agent = Agents.getById(id)
      if (!agent) throw new Error("Agent not found")
      return agent
    },
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AgentFormData & { clientId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return Agents.create({
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AgentFormData> }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated = Agents.update(id, data)
      if (!updated) throw new Error("Agent not found")
      return updated
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(data.id) })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const deleted = Agents.delete(id)
      if (!deleted) throw new Error("Agent not found")
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() })
    },
  })
}

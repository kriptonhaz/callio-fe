import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clients } from "../lib/mockDb"
import type { ClientFormData } from "../lib/schemas"


// Query Keys
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters: string) => [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
}

// Fetch all clients
export function useClients() {
  return useQuery({
    queryKey: clientKeys.lists(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      return Clients.getAll()
    },
  })
}

// Fetch single client
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const client = Clients.getById(id)
      if (!client) throw new Error("Client not found")
      return client
    },
    enabled: !!id,
  })
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return Clients.create({
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated = Clients.update(id, data)
      if (!updated) throw new Error("Client not found")
      return updated
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(data.id) })
    },
  })
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const deleted = Clients.delete(id)
      if (!deleted) throw new Error("Client not found")
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

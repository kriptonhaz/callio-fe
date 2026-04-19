import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type { Lead } from '@/lib/api/types/leads.types'
import type { PaginatedResponse } from '@/lib/api/types'

/**
 * Fetch EVERY lead for the given client by walking the paginated leads
 * endpoint. Backend caps `limit` at 100 per page so we loop up to 50 pages
 * (~5000 leads) as a safety ceiling. Cached for 5 minutes.
 *
 * Use this when you need a phone→lead or email→lead lookup map (e.g. the
 * WhatsApp details chat list and the email message list).
 */
export function useAllClientLeads(
  clientId: string | null | undefined,
): UseQueryResult<Array<Lead>, Error> {
  return useQuery({
    queryKey: ['leads-all', clientId],
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const all: Array<Lead> = []
      const limit = 100
      let page = 1
      let totalPages = 1
      do {
        const qs = buildQueryString({ clientId, page, limit })
        const resp = await apiClient
          .get(`leads${qs}`)
          .json<PaginatedResponse<Lead>>()
        all.push(...resp.data)
        totalPages = resp.meta.totalPages
        page += 1
      } while (page <= totalPages && page < 50)
      return all
    },
  })
}

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ServiceType } from '@/types/api'

interface CreateServiceTypePayload {
  name: string
  description?: string
  municipalityId: string
  expectedCompletionMinutes?: number
  requiredDocuments: { name: string; required: boolean }[]
}

export const serviceTypesQueryOptions = (municipalityId?: string) =>
  queryOptions({
    queryKey: ['service-types', municipalityId],
    queryFn: () =>
      api
        .get<ServiceType[]>('/service-types', {
          params: municipalityId ? { municipalityId } : undefined,
        })
        .then((r) => r.data),
    staleTime: 5 * 60_000,
  })

export function useCreateServiceType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateServiceTypePayload) =>
      api.post<{ id: string; name: string }>('/service-types', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
    },
  })
}

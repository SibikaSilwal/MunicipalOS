import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ServiceType } from '@/types/api'
import type { CreateServiceTypeValues } from '@/lib/validators/service-type'

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
    mutationFn: (data: CreateServiceTypeValues) =>
      api.post<{ id: string; name: string }>('/service-types', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
    },
  })
}

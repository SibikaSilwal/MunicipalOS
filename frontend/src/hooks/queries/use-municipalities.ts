import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Municipality, MunicipalityOfficer } from '@/types/api'

export const municipalitiesQueryOptions = () =>
  queryOptions({
    queryKey: ['municipalities'],
    queryFn: () =>
      api.get<Municipality[]>('/municipalities').then((r) => r.data),
    staleTime: 10 * 60_000,
  })

export const municipalityOfficersQueryOptions = (municipalityId: string) =>
  queryOptions({
    queryKey: ['municipalities', municipalityId, 'officers'],
    queryFn: () =>
      api
        .get<MunicipalityOfficer[]>(
          `/municipalities/${municipalityId}/officers`,
        )
        .then((r) => r.data),
    staleTime: 60_000,
    enabled: !!municipalityId,
  })

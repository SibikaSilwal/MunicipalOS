import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { WorkflowDefinition, RoleName } from '@/types/api'

export const workflowQueryOptions = (serviceTypeId: string) =>
  queryOptions({
    queryKey: ['workflows', serviceTypeId],
    queryFn: () =>
      api
        .get<WorkflowDefinition>(`/workflows/${serviceTypeId}`)
        .then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled: !!serviceTypeId,
  })

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      serviceTypeId: string
      steps: { stepOrder: number; roleRequired: RoleName; stepName: string; stepDescription?: string }[]
    }) =>
      api.post<{ id: string; serviceTypeId: string }>('/workflows', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.serviceTypeId],
      })
    },
  })
}

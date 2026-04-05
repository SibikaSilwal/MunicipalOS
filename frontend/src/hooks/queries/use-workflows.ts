import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/lib/api'
import type { WorkflowDefinition, RoleName } from '@/types/api'

/** `null` when the API returns 404 (no workflow). Avoids React Query keeping stale data on refetch errors. */
export const workflowQueryOptions = (serviceTypeId: string) =>
  queryOptions({
    queryKey: ['workflows', serviceTypeId],
    queryFn: async (): Promise<WorkflowDefinition | null> => {
      try {
        const r = await api.get<WorkflowDefinition>(`/workflows/${serviceTypeId}`)
        return r.data
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null
        throw err
      }
    },
    staleTime: 5 * 60_000,
    enabled: !!serviceTypeId,
  })

export type WorkflowStepPayload = {
  stepOrder: number
  roleRequired: RoleName
  stepName: string
  stepDescription?: string
  expectedCompletionMinutes?: number
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { serviceTypeId: string; steps: WorkflowStepPayload[] }) =>
      api.post<{ id: string; serviceTypeId: string }>('/workflows', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.serviceTypeId],
      })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { serviceTypeId: string; steps: WorkflowStepPayload[] }) =>
      api
        .put<{ id: string; serviceTypeId: string }>(`/workflows/${data.serviceTypeId}`, {
          steps: data.steps,
        })
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.serviceTypeId],
      })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (serviceTypeId: string) => api.delete(`/workflows/${serviceTypeId}`),
    onSuccess: (_data, serviceTypeId) => {
      queryClient.setQueryData<WorkflowDefinition | null>(
        ['workflows', serviceTypeId],
        null,
      )
      queryClient.invalidateQueries({
        queryKey: ['workflows', serviceTypeId],
      })
    },
  })
}

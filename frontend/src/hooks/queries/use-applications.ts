import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApplicationSummary, ApplicationDetail } from '@/types/api'

export const myApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'my'],
    queryFn: () =>
      api.get<ApplicationSummary[]>('/applications/my').then((r) => r.data),
    staleTime: 30_000,
  })

export const pendingApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'pending'],
    queryFn: () =>
      api.get<ApplicationSummary[]>('/applications/pending').then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 15_000,
  })

/** Officers and admins: every application in the municipality (all statuses). */
export const municipalityApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'municipality-all'],
    queryFn: () =>
      api.get<ApplicationSummary[]>('/applications/all').then((r) => r.data),
    staleTime: 15_000,
  })

/** Admin-only: approved and rejected applications for the municipality. */
export const completedApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'completed'],
    queryFn: () =>
      api.get<ApplicationSummary[]>('/applications/completed').then((r) => r.data),
    staleTime: 30_000,
  })

/** Active applications whose current workflow step is assigned to the signed-in officer */
export const myAssignedApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'my-assigned'],
    queryFn: () =>
      api
        .get<ApplicationSummary[]>('/officers/my-applications')
        .then((r) => r.data),
    staleTime: 15_000,
  })

export const applicationDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['applications', id],
    queryFn: () =>
      api.get<ApplicationDetail>(`/applications/${id}`).then((r) => r.data),
    staleTime: 30_000,
  })

export function useSubmitApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { serviceTypeId: string }) =>
      api
        .post<{ id: string; friendlyApplicationId: string }>('/applications', data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
    },
  })
}

export function useApproveApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      api.post(`/applications/${id}/approve`, { comment }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export function useRejectApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.post(`/applications/${id}/reject`, { comment }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export function useRequestDocuments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.post(`/applications/${id}/request-documents`, { comment }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export function usePickUpStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.post(`/applications/${id}/pick-up`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export function useAssignStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, officerId }: { id: string; officerId: string }) =>
      api.post(`/applications/${id}/assign-step`, { officerId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export function useCompleteStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      api.post(`/applications/${id}/complete-step`, { comment }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'my-assigned'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'completed'] })
      queryClient.invalidateQueries({ queryKey: ['applications', 'municipality-all'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

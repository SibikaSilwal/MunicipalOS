import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Notification } from '@/types/api'

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<Notification[]>('/notifications').then((r) => r.data),
    staleTime: 10_000,
    refetchInterval: 10_000,
  })

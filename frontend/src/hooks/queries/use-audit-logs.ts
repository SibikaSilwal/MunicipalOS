import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AuditLogEntry } from '@/types/api'

interface AuditLogFilters {
  userId?: string
  applicationId?: string
  eventType?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export const auditLogsQueryOptions = (filters: AuditLogFilters = {}) =>
  queryOptions({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      api
        .get<AuditLogEntry[]>('/admin/audit-logs', { params: filters })
        .then((r) => r.data),
    staleTime: 30_000,
  })

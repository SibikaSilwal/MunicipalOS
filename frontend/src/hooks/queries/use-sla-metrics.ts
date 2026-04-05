import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  PagedSlaApplicationsDto,
  SlaApplicationReportRow,
  SlaDashboardDto,
} from '@/types/api'

export interface SlaDashboardQueryParams {
  from?: string
  to?: string
  serviceTypeId?: string
  includeRejected: boolean
}

export interface SlaApplicationsReportParams extends SlaDashboardQueryParams {
  page: number
  pageSize: number
  withinSlaOnly: boolean
  breachedOnly: boolean
  terminalOfficerId?: string
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (camel in obj) return obj[camel] as T
  if (pascal in obj) return obj[pascal] as T
  return undefined
}

function pickStr(obj: Record<string, unknown>, camel: string, pascal: string): string {
  const v = pick<unknown>(obj, camel, pascal)
  return v == null ? '' : String(v).trim()
}

function pickNum(obj: Record<string, unknown>, camel: string, pascal: string): number {
  const v = pick<unknown>(obj, camel, pascal)
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return 0
}

/** Handles camelCase or PascalCase JSON and missing friendly ids. */
function normalizeSlaReportRow(raw: Record<string, unknown>): SlaApplicationReportRow {
  const applicationId = pickStr(raw, 'applicationId', 'ApplicationId')
  const snakeFriendly = raw['friendly_application_id']
  const friendlyApplicationId =
    pickStr(raw, 'friendlyApplicationId', 'FriendlyApplicationId') ||
    (typeof snakeFriendly === 'string' ? snakeFriendly.trim() : '')

  const terminalRaw = pick<unknown>(
    raw,
    'terminalOfficerId',
    'TerminalOfficerId',
  )
  const terminalOfficerId =
    terminalRaw == null || terminalRaw === ''
      ? null
      : String(terminalRaw)

  const minutesRaw = pick<unknown>(raw, 'minutesLate', 'MinutesLate')
  let minutesLate: number | null = null
  if (minutesRaw != null && minutesRaw !== '') {
    const n =
      typeof minutesRaw === 'number' ? minutesRaw : Number(minutesRaw)
    if (Number.isFinite(n)) minutesLate = n
  }

  return {
    applicationId,
    friendlyApplicationId,
    serviceTypeName: pickStr(raw, 'serviceTypeName', 'ServiceTypeName'),
    status: pickStr(raw, 'status', 'Status'),
    completedAt: pickStr(raw, 'completedAt', 'CompletedAt'),
    dueAt: pickStr(raw, 'dueAt', 'DueAt'),
    withinSla: Boolean(pick(raw, 'withinSla', 'WithinSla')),
    terminalOfficerId,
    terminalOfficerName:
      pickStr(raw, 'terminalOfficerName', 'TerminalOfficerName') || null,
    minutesLate,
  }
}

function normalizePagedSlaApplications(raw: unknown): PagedSlaApplicationsDto {
  const o = raw as Record<string, unknown>
  const itemsRaw = (o.items ?? o.Items) as unknown[] | undefined
  return {
    items: (itemsRaw ?? []).map((row) =>
      normalizeSlaReportRow(row as Record<string, unknown>),
    ),
    totalCount: pickNum(o, 'totalCount', 'TotalCount'),
    page: pickNum(o, 'page', 'Page'),
    pageSize: pickNum(o, 'pageSize', 'PageSize'),
  }
}

export const slaDashboardQueryOptions = (params: SlaDashboardQueryParams) =>
  queryOptions({
    queryKey: ['sla-dashboard', params] as const,
    queryFn: () =>
      api
        .get<SlaDashboardDto>('/applications/metrics/sla/dashboard', {
          params: {
            from: params.from,
            to: params.to,
            serviceTypeId: params.serviceTypeId,
            includeRejected: params.includeRejected,
          },
        })
        .then((r) => r.data),
  })

export const slaApplicationsReportQueryOptions = (
  params: SlaApplicationsReportParams,
) =>
  queryOptions({
    queryKey: ['sla-applications-report', params] as const,
    queryFn: () =>
      api
        .get<unknown>('/applications/metrics/sla/applications', {
          params: {
            from: params.from,
            to: params.to,
            serviceTypeId: params.serviceTypeId,
            includeRejected: params.includeRejected,
            page: params.page,
            pageSize: params.pageSize,
            withinSlaOnly: params.withinSlaOnly,
            breachedOnly: params.breachedOnly,
            terminalOfficerId: params.terminalOfficerId,
          },
        })
        .then((r) => normalizePagedSlaApplications(r.data)),
  })

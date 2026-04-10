import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { municipalityOfficersQueryOptions } from '@/hooks/queries/use-municipalities'
import {
  slaApplicationsReportQueryOptions,
  slaDashboardQueryOptions,
} from '@/hooks/queries/use-sla-metrics'
import { serviceTypesQueryOptions } from '@/hooks/queries/use-service-types'
import { SlaOutcomeBarChart } from '@/components/admin/sla-outcome-bar-chart'
import { cn, formatDate } from '@/lib/utils'
import type { SlaApplicationReportRow, SlaServiceBreakdownRow } from '@/types/api'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 20

export interface MetricsSearch {
  from?: string
  to?: string
  serviceTypeId?: string
  includeRejected: boolean
  page: number
  withinSlaOnly: boolean
  breachedOnly: boolean
  terminalOfficerId?: string
}

function parseOptionalDayParam(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

function parseMetricsSearch(
  search: Record<string, unknown>,
): MetricsSearch {
  const page = Number(search.page)
  return {
    from: parseOptionalDayParam(search.from),
    to: parseOptionalDayParam(search.to),
    serviceTypeId:
      typeof search.serviceTypeId === 'string' && search.serviceTypeId
        ? search.serviceTypeId
        : undefined,
    includeRejected:
      search.includeRejected === true || search.includeRejected === 'true',
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    withinSlaOnly:
      search.withinSlaOnly === true || search.withinSlaOnly === 'true',
    breachedOnly:
      search.breachedOnly === true || search.breachedOnly === 'true',
    terminalOfficerId:
      typeof search.terminalOfficerId === 'string' &&
      search.terminalOfficerId
        ? search.terminalOfficerId
        : undefined,
  }
}

function toApiFrom(day: string | undefined) {
  if (!day?.trim()) return undefined
  return `${day}T00:00:00.000Z`
}

function toApiTo(day: string | undefined) {
  if (!day?.trim()) return undefined
  return `${day}T23:59:59.999Z`
}

interface FilterFormState {
  from: string
  to: string
  serviceTypeId: string
  includeRejected: boolean
  withinSlaOnly: boolean
  breachedOnly: boolean
  terminalOfficerId: string
}

function searchToForm(s: MetricsSearch): FilterFormState {
  return {
    from: s.from ?? '',
    to: s.to ?? '',
    serviceTypeId: s.serviceTypeId ?? '',
    includeRejected: s.includeRejected,
    withinSlaOnly: s.withinSlaOnly,
    breachedOnly: s.breachedOnly,
    terminalOfficerId: s.terminalOfficerId ?? '',
  }
}

function formToSearch(
  f: FilterFormState,
  page: number,
): MetricsSearch {
  return {
    from: f.from.trim() || undefined,
    to: f.to.trim() || undefined,
    serviceTypeId: f.serviceTypeId.trim() || undefined,
    includeRejected: f.includeRejected,
    page,
    withinSlaOnly: f.withinSlaOnly,
    breachedOnly: f.breachedOnly,
    terminalOfficerId: f.terminalOfficerId.trim() || undefined,
  }
}

export const Route = createFileRoute('/_authenticated/admin/metrics')({
  validateSearch: (search: Record<string, unknown>): MetricsSearch =>
    parseMetricsSearch(search),
  beforeLoad: ({ context }) => {
    const role = context.auth.user?.role
    if (role !== 'Admin') {
      throw redirect({
        to: role === 'Citizen' ? '/citizen/dashboard' : '/officer/dashboard',
      })
    }
  },
  component: SlaMetricsPage,
})

const onTimeCellStyle = {
  color: '#065f46',
  fontWeight: 600,
} as const

function applicationReferenceLabel(row: SlaApplicationReportRow) {
  const ref = row.friendlyApplicationId?.trim()
  return ref || `${row.applicationId.slice(0, 8)}…`
}

/** Extra field for DataTable quick filter (reference, service, id, officer). */
type SlaDetailGridRow = SlaApplicationReportRow & { quickFilterText: string }

function SlaMetricsPage() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { user } = useAuth()
  const municipalityId = user?.municipalityId ?? ''

  const [form, setForm] = useState<FilterFormState>(() =>
    searchToForm(search),
  )

  useEffect(() => {
    setForm(searchToForm(search))
  }, [search])

  const dashboardParams = useMemo(
    () => ({
      from: toApiFrom(search.from),
      to: toApiTo(search.to),
      serviceTypeId: search.serviceTypeId,
      includeRejected: search.includeRejected,
    }),
    [search],
  )

  const reportParams = useMemo(
    () => ({
      ...dashboardParams,
      page: search.page,
      pageSize: PAGE_SIZE,
      withinSlaOnly: search.withinSlaOnly,
      breachedOnly: search.breachedOnly,
      terminalOfficerId: search.terminalOfficerId,
    }),
    [dashboardParams, search],
  )

  const { data: serviceTypes = [] } = useQuery(
    serviceTypesQueryOptions(municipalityId),
  )
  const { data: officers = [] } = useQuery(
    municipalityOfficersQueryOptions(municipalityId),
  )

  const { data: dashboard, isLoading: dashLoading } = useQuery(
    slaDashboardQueryOptions(dashboardParams),
  )

  const { data: report, isLoading: reportLoading } = useQuery(
    slaApplicationsReportQueryOptions(reportParams),
  )

  function applyFilters(resetPage = true) {
    navigate({
      to: '/admin/metrics',
      search: formToSearch(form, resetPage ? 1 : search.page),
    })
  }

  function resetFilters() {
    const empty: MetricsSearch = {
      includeRejected: false,
      page: 1,
      withinSlaOnly: false,
      breachedOnly: false,
    }
    setForm(searchToForm(empty))
    navigate({ to: '/admin/metrics', search: empty })
  }

  const totalPages = report
    ? Math.max(1, Math.ceil(report.totalCount / report.pageSize))
    : 1

  const detailGridRows: SlaDetailGridRow[] = useMemo(
    () =>
      (report?.items ?? []).map((r) => ({
        ...r,
        quickFilterText: [
          r.friendlyApplicationId,
          r.serviceTypeName,
          r.applicationId,
          r.terminalOfficerName ?? '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      })),
    [report?.items],
  )

  const serviceCols: ColDef<SlaServiceBreakdownRow>[] = useMemo(
    () => [
      { field: 'serviceTypeName', headerName: t('sla.service'), minWidth: 160 },
      {
        field: 'totalCompleted',
        headerName: t('sla.completed'),
        maxWidth: 120,
      },
      {
        field: 'completedWithinSla',
        headerName: t('sla.onTime'),
        maxWidth: 100,
        cellStyle: onTimeCellStyle,
      },
      {
        field: 'breached',
        headerName: t('sla.pastDue'),
        maxWidth: 100,
        cellStyle: { color: '#9a3412', fontWeight: 600 },
      },
      {
        field: 'percentCompletedWithinSla',
        headerName: `% ${t('sla.onTime')}`,
        maxWidth: 110,
        valueFormatter: (p) =>
          p.value != null ? `${Number(p.value).toFixed(1)}%` : '',
        cellStyle: (p) =>
          p.value != null && Number(p.value) >= 80 ? onTimeCellStyle : undefined,
      },
    ],
    [t],
  )

  const detailCols: ColDef<SlaDetailGridRow>[] = useMemo(
    () => [
      {
        colId: 'applicationRef',
        headerName: t('sla.reference'),
        minWidth: 200,
        maxWidth: 300,
        valueGetter: (p) => (p.data ? applicationReferenceLabel(p.data) : ''),
        cellRenderer: (p: ICellRendererParams<SlaDetailGridRow>) =>
          p.data ? (
            <Link
              to="/officer/review/$id"
              params={{ id: p.data.applicationId }}
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {applicationReferenceLabel(p.data)}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </Link>
          ) : null,
      },
      { field: 'serviceTypeName', headerName: t('sla.service') },
      { field: 'status', headerName: t('applications.statusLabel'), maxWidth: 110 },
      {
        field: 'completedAt',
        headerName: t('sla.completed'),
        valueFormatter: (p) => (p.value ? formatDate(String(p.value)) : ''),
      },
      {
        field: 'dueAt',
        headerName: t('sla.due'),
        valueFormatter: (p) => (p.value ? formatDate(String(p.value)) : ''),
      },
      {
        colId: 'withinSla',
        headerName: 'SLA',
        maxWidth: 120,
        cellRenderer: (p: ICellRendererParams<SlaDetailGridRow>) => {
          if (!p.data) return null
          return p.data.withinSla ? (
            <span className="inline-flex rounded-md bg-[#065f46] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              {t('sla.onTime')}
            </span>
          ) : (
            <span className="inline-flex rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm dark:bg-red-700">
              {t('sla.pastDue')}
            </span>
          )
        },
      },
      { field: 'terminalOfficerName', headerName: t('sla.officer') },
      {
        field: 'minutesLate',
        headerName: 'Min late',
        maxWidth: 100,
        valueFormatter: (p) => (p.value == null ? '—' : String(p.value)),
      },
    ],
    [t],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <PageHeader title={t('admin.metrics.title')} />

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="sla-from" className="text-xs">
                {t('admin.metrics.from')}
              </Label>
              <Input
                id="sla-from"
                type="date"
                className="h-9 w-[148px]"
                autoComplete="off"
                value={form.from}
                onChange={(e) =>
                  setForm((s) => ({ ...s, from: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="sla-to" className="text-xs">
                {t('admin.metrics.to')}
              </Label>
              <Input
                id="sla-to"
                type="date"
                className="h-9 w-[148px]"
                autoComplete="off"
                value={form.to}
                onChange={(e) =>
                  setForm((s) => ({ ...s, to: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t('admin.metrics.service')}</Label>
              <Select
                value={form.serviceTypeId || '__all__'}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    serviceTypeId: v === '__all__' || v == null ? '' : v,
                  }))
                }
                itemToStringLabel={(v) =>
                  v === '__all__' || v == null
                    ? t('admin.metrics.all')
                    : (serviceTypes.find((st) => st.id === v)?.name ?? String(v))
                }
              >
                <SelectTrigger className="h-9 w-[min(100vw-2rem,200px)] sm:w-[200px]">
                  <SelectValue placeholder={t('admin.metrics.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('admin.metrics.all')}</SelectItem>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t('admin.metrics.officer')}</Label>
              <Select
                value={form.terminalOfficerId || '__all__'}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    terminalOfficerId: v === '__all__' || v == null ? '' : v,
                  }))
                }
                itemToStringLabel={(v) =>
                  v === '__all__' || v == null
                    ? t('admin.metrics.all')
                    : (officers.find((o) => o.id === v)?.fullName ?? String(v))
                }
              >
                <SelectTrigger className="h-9 w-[min(100vw-2rem,200px)] sm:w-[200px]">
                  <SelectValue placeholder={t('admin.metrics.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('admin.metrics.all')}</SelectItem>
                  {officers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-border pt-1 sm:border-l sm:pl-3 sm:pt-0">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input"
                  checked={form.includeRejected}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      includeRejected: e.target.checked,
                    }))
                  }
                />
                {t('admin.metrics.includeRejected')}
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input"
                  checked={form.withinSlaOnly}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      withinSlaOnly: e.target.checked,
                      breachedOnly: e.target.checked ? false : s.breachedOnly,
                    }))
                  }
                />
                {t('admin.metrics.onTime')}
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input"
                  checked={form.breachedOnly}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      breachedOnly: e.target.checked,
                      withinSlaOnly: e.target.checked ? false : s.withinSlaOnly,
                    }))
                  }
                />
                {t('admin.metrics.breached')}
              </label>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => applyFilters(true)}
            >
              {t('admin.metrics.apply')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetFilters}
            >
              {t('admin.metrics.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title={t('admin.metrics.kpi.completed')}
            value={dashboard.totalCompleted}
            subtitle={t('admin.metrics.kpi.inSelectedPeriod')}
          />
          <KpiCard
            variant="onTime"
            title={t('sla.onTime')}
            value={dashboard.completedWithinSla}
            subtitle={t('admin.metrics.kpi.metOrBeatDueDate')}
          />
          <KpiCard
            variant="pastDue"
            title={t('sla.pastDue')}
            value={dashboard.breached}
            subtitle={t('admin.metrics.kpi.finishedAfterDueDate')}
          />
          <KpiCard
            title={t('admin.metrics.kpi.onTimeRate')}
            value={`${dashboard.percentCompletedWithinSla.toFixed(1)}%`}
            subtitle={t('admin.metrics.kpi.shareOfCompletedWithSla')}
          />
        </div>
      ) : null}

      {dashboard && !dashLoading ? (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base">
              {t('admin.metrics.outcomesTitle')}
            </CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              {t('admin.metrics.outcomesDescription')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {dashboard.totalCompleted === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                {t('admin.metrics.noCompletedInPeriod')}
              </p>
            ) : (
              <SlaOutcomeBarChart
                onTime={dashboard.completedWithinSla}
                pastDue={dashboard.breached}
                className="h-[280px] w-full"
              />
            )}
          </CardContent>
        </Card>
      ) : dashLoading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : null}

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t('admin.metrics.byServiceTitle')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('admin.metrics.byServiceDescription')}
          </p>
        </div>
        <DataTable
          columnDefs={serviceCols}
          rowData={dashboard?.byService ?? []}
          gridHeight={300}
          searchPlaceholder={t('admin.metrics.filterServicesPlaceholder')}
          searchColumn="serviceTypeName"
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t('admin.metrics.applicationsTitle')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('admin.metrics.applicationsDescription')}
          </p>
        </div>
        {reportLoading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <>
            <DataTable
              columnDefs={detailCols}
              rowData={detailGridRows}
              autoHeight
              searchPlaceholder={t('admin.metrics.filterDetailsPlaceholder')}
              searchColumn="quickFilterText"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {report
                  ? t('admin.metrics.totalPageLabel', {
                      total: report.totalCount,
                      page: report.page,
                      pages: totalPages,
                    })
                  : null}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!report || report.page <= 1}
                  onClick={() =>
                    navigate({
                      to: '/admin/metrics',
                      search: {
                        ...search,
                        page: Math.max(1, search.page - 1),
                      },
                    })
                  }
                >
                  {t('common.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!report || report.page >= totalPages}
                  onClick={() =>
                    navigate({
                      to: '/admin/metrics',
                      search: { ...search, page: search.page + 1 },
                    })
                  }
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

type KpiVariant = 'default' | 'onTime' | 'pastDue'

function KpiCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: {
  title: string
  value: string | number
  subtitle: string
  variant?: KpiVariant
}) {
  return (
    <Card
      className={cn(
        'shadow-sm transition-shadow hover:shadow-md',
        variant === 'onTime' &&
          'border-emerald-800/20 bg-emerald-50/80 ring-1 ring-emerald-800/10 dark:bg-emerald-950/25 dark:ring-emerald-700/30',
        variant === 'pastDue' &&
          'border-orange-200/80 bg-orange-50/50 ring-1 ring-orange-200/60 dark:border-orange-900/40 dark:bg-orange-950/20 dark:ring-orange-900/40',
      )}
    >
      <CardHeader className="pb-1">
        <CardTitle
          className={cn(
            'text-sm font-medium',
            variant === 'onTime' && 'text-emerald-900 dark:text-emerald-100',
            variant === 'pastDue' && 'text-orange-900 dark:text-orange-100',
            variant === 'default' && 'text-muted-foreground',
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-3xl font-semibold tracking-tight tabular-nums',
            variant === 'onTime' && 'text-[#065f46] dark:text-emerald-400',
            variant === 'pastDue' && 'text-orange-800 dark:text-orange-300',
          )}
        >
          {value}
        </p>
        <p className="text-muted-foreground mt-1.5 text-xs leading-snug">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  )
}

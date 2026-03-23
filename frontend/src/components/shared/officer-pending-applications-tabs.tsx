import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  myAssignedApplicationsQueryOptions,
  pendingApplicationsQueryOptions,
} from '@/hooks/queries/use-applications'
import type { ApplicationSummary } from '@/types/api'
import { formatDate, formatRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const dashboardColumnDefs: ColDef<ApplicationSummary>[] = [
  {
    field: 'id',
    headerName: 'Application ID',
    flex: 0,
    minWidth: 120,
    maxWidth: 140,
    cellClass: 'font-mono text-xs',
    valueFormatter: (p) =>
      p.value ? `${String(p.value).slice(0, 8)}…` : '',
  },
  { field: 'serviceTypeName', headerName: 'Service Type' },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? <StatusBadge status={p.data.status} /> : null,
  },
  {
    colId: 'submittedAt',
    field: 'submittedAt',
    headerName: 'Submitted',
    valueGetter: (p) =>
      p.data ? new Date(p.data.submittedAt).getTime() : 0,
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? formatDate(p.data.submittedAt) : null,
  },
  {
    colId: 'daysPending',
    headerName: 'Pending Since',
    valueGetter: (p) =>
      p.data ? new Date(p.data.submittedAt).getTime() : 0,
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? (
        <Badge variant="outline">
          {formatRelative(p.data.submittedAt)}
        </Badge>
      ) : null,
  },
]

const catalogColumnDefs: ColDef<ApplicationSummary>[] = [
  {
    field: 'id',
    headerName: 'Application ID',
    flex: 0,
    minWidth: 120,
    maxWidth: 140,
    cellClass: 'font-mono text-xs',
    valueFormatter: (p) =>
      p.value ? `${String(p.value).slice(0, 8)}…` : '',
  },
  { field: 'serviceTypeName', headerName: 'Service Type' },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? <StatusBadge status={p.data.status} /> : null,
  },
  {
    field: 'currentStep',
    headerName: 'Step',
    maxWidth: 120,
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? (
        <Badge variant="outline">Step {p.data.currentStep}</Badge>
      ) : null,
  },
  {
    colId: 'submittedAt',
    field: 'submittedAt',
    headerName: 'Submitted',
    valueGetter: (p) =>
      p.data ? new Date(p.data.submittedAt).getTime() : 0,
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? formatDate(p.data.submittedAt) : null,
  },
  {
    colId: 'age',
    headerName: 'Age',
    maxWidth: 120,
    sortable: false,
    cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
      p.data ? (
        <span className="text-xs text-muted-foreground">
          {formatRelative(p.data.submittedAt)}
        </span>
      ) : null,
  },
]

type TabValue = 'all' | 'mine'

export interface OfficerPendingApplicationsTabsProps {
  /** Queue view (officer dashboard) vs full catalog (all applications page) */
  variant: 'dashboard' | 'catalog'
  title: string
}

export function OfficerPendingApplicationsTabs({
  variant,
  title,
}: OfficerPendingApplicationsTabsProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabValue>('all')
  const columnDefs =
    variant === 'dashboard' ? dashboardColumnDefs : catalogColumnDefs

  const pendingQuery = useQuery(pendingApplicationsQueryOptions())
  const assignedQuery = useQuery({
    ...myAssignedApplicationsQueryOptions(),
    enabled: tab === 'mine',
  })

  const pending = pendingQuery.data ?? []
  const assigned = assignedQuery.data ?? []

  const description =
    tab === 'all'
      ? variant === 'dashboard'
        ? `${pending.length} application(s) awaiting review`
        : `${pending.length} active application(s) across the municipality`
      : assignedQuery.isLoading
        ? 'Loading assignments…'
        : `${assigned.length} application(s) assigned to you`

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">All pending applications</TabsTrigger>
          <TabsTrigger value="mine">Assigned to me</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === 'all' ? (
          <DataTable
            columnDefs={columnDefs}
            rowData={pending}
            searchColumn="serviceTypeName"
            searchPlaceholder="Filter by service type..."
            onRowClick={(row) =>
              navigate({
                to: '/officer/review/$id',
                params: { id: row.id },
              })
            }
          />
        ) : assignedQuery.isLoading ? (
          <Skeleton className="h-[440px] w-full rounded-md" />
        ) : assignedQuery.isError ? (
          <p className="text-sm text-destructive">
            {assignedQuery.error instanceof Error
              ? assignedQuery.error.message
              : 'Could not load your assignments.'}
          </p>
        ) : (
          <DataTable
            columnDefs={columnDefs}
            rowData={assigned}
            searchColumn="serviceTypeName"
            searchPlaceholder="Filter by service type..."
            onRowClick={(row) =>
              navigate({
                to: '/officer/review/$id',
                params: { id: row.id },
              })
            }
          />
        )}
      </div>
    </div>
  )
}

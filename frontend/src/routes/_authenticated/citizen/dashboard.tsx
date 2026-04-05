import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { myApplicationsQueryOptions } from '@/hooks/queries/use-applications'
import type { ApplicationSummary } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { FilePlus, FileCheck, Clock, XCircle, Files } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/citizen/dashboard')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(myApplicationsQueryOptions()),
  component: CitizenDashboard,
})

function CitizenDashboard() {
  const navigate = useNavigate()
  const { data: applications = [] } = useQuery(myApplicationsQueryOptions())

  const columns: ColDef<ApplicationSummary>[] = [
    {
      field: 'friendlyApplicationId',
      headerName: 'Application',
      flex: 0,
      minWidth: 140,
      maxWidth: 200,
      cellClass: 'font-mono text-xs',
    },
    {
      field: 'serviceTypeName',
      headerName: 'Service Type',
    },
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
      colId: 'actions',
      headerName: '',
      flex: 0,
      minWidth: 100,
      maxWidth: 120,
      sortable: false,
      cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
        p.data ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              navigate({
                to: '/citizen/applications/$id',
                params: { id: p.data!.id },
              })
            }}
          >
            View
          </Button>
        ) : null,
    },
  ]

  const total = applications.length
  const pending = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'UnderReview',
  ).length
  const approved = applications.filter((a) => a.status === 'Approved').length
  const rejected = applications.filter((a) => a.status === 'Rejected').length

  const stats = [
    { label: 'Total', value: total, icon: Files, color: 'text-primary' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-warning' },
    {
      label: 'Approved',
      value: approved,
      icon: FileCheck,
      color: 'text-success',
    },
    {
      label: 'Rejected',
      value: rejected,
      icon: XCircle,
      color: 'text-destructive',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="View and manage your service applications"
      >
        <Button onClick={() => navigate({ to: '/citizen/apply' })}>
          <FilePlus className="mr-2 h-4 w-4" />
          Apply for Service
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columnDefs={columns}
        rowData={applications}
        searchColumn="serviceTypeName"
        searchPlaceholder="Search by service type..."
        onRowClick={(row) =>
          navigate({
            to: '/citizen/applications/$id',
            params: { id: row.id },
          })
        }
      />
    </div>
  )
}

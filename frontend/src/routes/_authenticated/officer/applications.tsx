import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, SortableHeader } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { pendingApplicationsQueryOptions } from '@/hooks/queries/use-applications'
import type { ApplicationSummary } from '@/types/api'
import { formatDate, formatRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/officer/applications')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
  component: AllApplicationsPage,
})

function AllApplicationsPage() {
  const navigate = useNavigate()
  const { data: applications = [] } = useQuery(
    pendingApplicationsQueryOptions(),
  )

  const columns: ColumnDef<ApplicationSummary>[] = [
    {
      accessorKey: 'id',
      header: 'Application ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'serviceTypeName',
      header: ({ column }) => (
        <SortableHeader column={column} label="Service Type" />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        return row.original.status === filterValue
      },
    },
    {
      accessorKey: 'currentStep',
      header: 'Step',
      cell: ({ row }) => (
        <Badge variant="outline">Step {row.original.currentStep}</Badge>
      ),
    },
    {
      accessorKey: 'submittedAt',
      header: ({ column }) => (
        <SortableHeader column={column} label="Submitted" />
      ),
      cell: ({ row }) => formatDate(row.original.submittedAt),
    },
    {
      id: 'age',
      header: 'Age',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelative(row.original.submittedAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Active Applications"
        description={`${applications.length} active application(s) across the municipality`}
      />

      <DataTable
        columns={columns}
        data={applications}
        searchColumn="serviceTypeName"
        searchPlaceholder="Filter by service type..."
        onRowClick={(row) =>
          navigate({
            to: '/officer/review/$id',
            params: { id: row.id },
          })
        }
      />
    </div>
  )
}

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

export const Route = createFileRoute('/_authenticated/officer/dashboard')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
  component: OfficerDashboard,
})

function OfficerDashboard() {
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
    },
    {
      accessorKey: 'submittedAt',
      header: ({ column }) => (
        <SortableHeader column={column} label="Submitted" />
      ),
      cell: ({ row }) => formatDate(row.original.submittedAt),
    },
    {
      id: 'daysPending',
      header: ({ column }) => (
        <SortableHeader column={column} label="Pending Since" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{formatRelative(row.original.submittedAt)}</Badge>
      ),
      sortingFn: (rowA, rowB) => {
        return (
          new Date(rowA.original.submittedAt).getTime() -
          new Date(rowB.original.submittedAt).getTime()
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Queue"
        description={`${applications.length} application(s) awaiting review`}
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

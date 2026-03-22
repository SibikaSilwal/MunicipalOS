import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { auditLogsQueryOptions } from '@/hooks/queries/use-audit-logs'
import type { AuditLogEntry } from '@/types/api'
import { formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/admin/audit-logs')({
  component: AuditLogsPage,
})

const eventTypes = [
  'ApplicationSubmitted',
  'ApplicationApproved',
  'ApplicationRejected',
  'DocumentsRequested',
  'DocumentUploaded',
  'UserRegistered',
  'ServiceTypeCreated',
  'WorkflowCreated',
]

function AuditLogsPage() {
  const [filters, setFilters] = useState({
    userId: '',
    applicationId: '',
    eventType: '',
    from: '',
    to: '',
    page: 1,
    pageSize: 20,
  })

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== 0),
  )

  const { data: logs = [] } = useQuery(auditLogsQueryOptions(activeFilters))

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">
          {formatDateTime(row.original.timestamp)}
        </span>
      ),
    },
    { accessorKey: 'eventType', header: 'Event' },
    {
      accessorKey: 'userId',
      header: 'User ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.userId.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'applicationId',
      header: 'Application',
      cell: ({ row }) =>
        row.original.applicationId ? (
          <span className="font-mono text-xs">
            {row.original.applicationId.slice(0, 8)}...
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'metadata',
      header: 'Metadata',
      cell: ({ row }) =>
        row.original.metadata ? (
          <pre className="max-w-xs truncate text-xs text-muted-foreground">
            {JSON.stringify(row.original.metadata)}
          </pre>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Search and review system activity" />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Event Type</Label>
              <Select
                value={filters.eventType}
                onValueChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    eventType: val === 'all' ? '' : (val ?? ''),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {eventTypes.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">User ID</Label>
              <Input
                value={filters.userId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userId: e.target.value }))
                }
                placeholder="User ID..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Application ID</Label>
              <Input
                value={filters.applicationId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    applicationId: e.target.value,
                  }))
                }
                placeholder="Application ID..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={logs} />
    </div>
  )
}

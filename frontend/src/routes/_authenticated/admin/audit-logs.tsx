import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
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

const columns: ColDef<AuditLogEntry>[] = [
  {
    field: 'timestamp',
    headerName: 'Timestamp',
    flex: 0,
    minWidth: 160,
    valueGetter: (p) => (p.data ? new Date(p.data.timestamp).getTime() : 0),
    cellRenderer: (p: ICellRendererParams<AuditLogEntry>) =>
      p.data ? (
        <span className="whitespace-nowrap text-xs">
          {formatDateTime(p.data.timestamp)}
        </span>
      ) : null,
  },
  { field: 'eventType', headerName: 'Event' },
  {
    field: 'userId',
    headerName: 'User ID',
    cellClass: 'font-mono text-xs',
    valueFormatter: (p) =>
      p.value ? `${String(p.value).slice(0, 8)}…` : '',
  },
  {
    field: 'applicationId',
    headerName: 'Application',
    cellRenderer: (p: ICellRendererParams<AuditLogEntry>) =>
      p.data?.applicationId ? (
        <span className="font-mono text-xs">
          {p.data.applicationId.slice(0, 8)}…
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    colId: 'metadata',
    headerName: 'Metadata',
    sortable: false,
    cellRenderer: (p: ICellRendererParams<AuditLogEntry>) =>
      p.data?.metadata ? (
        <pre className="max-w-xs truncate text-xs text-muted-foreground">
          {JSON.stringify(p.data.metadata)}
        </pre>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Search and review system activity"
      />

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

      <DataTable columnDefs={columns} rowData={logs} gridHeight={480} />
    </div>
  )
}

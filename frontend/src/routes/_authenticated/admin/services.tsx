import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { useAuth } from '@/hooks/use-auth'
import {
  serviceTypesQueryOptions,
  useCreateServiceType,
} from '@/hooks/queries/use-service-types'
import {
  formatSlaDays,
  formatSlaMinutes,
  parseSlaDaysToMinutes,
  SLA_DAY_OPTIONS,
} from '@/lib/sla'
import type { ServiceType } from '@/types/api'
import { Plus, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/admin/services')({
  component: ServiceTypesPage,
})

interface DocRow {
  name: string
  required: boolean
}

const columns: ColDef<ServiceType>[] = [
  { field: 'name', headerName: 'Name' },
  {
    field: 'description',
    headerName: 'Description',
    cellRenderer: (p: ICellRendererParams<ServiceType>) =>
      p.data ? (
        <span className="text-muted-foreground">
          {p.data.description || '—'}
        </span>
      ) : null,
  },
  {
    colId: 'documents',
    headerName: 'Required Docs',
    maxWidth: 140,
    valueGetter: (p) => p.data?.requiredDocuments.length ?? 0,
  },
  {
    colId: 'expectedSla',
    headerName: 'Expected SLA',
    valueGetter: (p) =>
      formatSlaMinutes(p.data?.expectedCompletionMinutes),
  },
]

function ServiceTypesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: serviceTypes = [] } = useQuery(
    serviceTypesQueryOptions(user?.municipalityId),
  )
  const createServiceType = useCreateServiceType()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expectedCompletionDays, setExpectedCompletionDays] = useState('')
  const [docs, setDocs] = useState<DocRow[]>([{ name: '', required: true }])

  function addDocRow() {
    setDocs((prev) => [...prev, { name: '', required: true }])
  }

  function removeDocRow(index: number) {
    setDocs((prev) => prev.filter((_, i) => i !== index))
  }

  function updateDoc(index: number, field: keyof DocRow, value: string | boolean) {
    setDocs((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  function resetForm() {
    setName('')
    setDescription('')
    setExpectedCompletionDays('')
    setDocs([{ name: '', required: true }])
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    const parsedSla = parseSlaDaysToMinutes(expectedCompletionDays)
    if (parsedSla.error) {
      toast.error(parsedSla.error)
      return
    }

    try {
      await createServiceType.mutateAsync({
        name,
        description: description || undefined,
        municipalityId: user?.municipalityId ?? '',
        expectedCompletionMinutes: parsedSla.value,
        requiredDocuments: docs.filter((d) => d.name.trim()),
      })
      toast.success('Service type created')
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create service type',
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Types"
        description="Manage the services offered by your municipality"
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Service Type
        </Button>
      </PageHeader>

      <DataTable
        columnDefs={columns}
        rowData={serviceTypes}
        searchColumn="name"
        searchPlaceholder="Search service types..."
        onRowClick={(row) =>
          navigate({
            to: '/admin/workflows',
            search: { serviceTypeId: row.id },
          })
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Service Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Birth Certificate"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the service..."
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Completion (days)</Label>
              <Select
                value={expectedCompletionDays}
                onValueChange={(value) => setExpectedCompletionDays(value ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expected completion days" />
                </SelectTrigger>
                <SelectContent>
                  {SLA_DAY_OPTIONS.map((days) => {
                    const value = days.toString()
                    return (
                      <SelectItem key={value} value={value}>
                        {formatSlaDays(days)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {expectedCompletionDays.trim()
                  ? `Preview: ${formatSlaDays(Number(expectedCompletionDays))}`
                  : 'Leave blank if no service-level SLA is configured.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Required Documents</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDocRow}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDoc(i, 'name', e.target.value)}
                    placeholder="Document name"
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={doc.required}
                      onChange={(e) =>
                        updateDoc(i, 'required', e.target.checked)
                      }
                      className="rounded border-input"
                    />
                    Required
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocRow(i)}
                    disabled={docs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createServiceType.isPending}
            >
              {createServiceType.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

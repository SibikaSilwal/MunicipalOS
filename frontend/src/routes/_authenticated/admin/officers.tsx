import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { useUpdateUserRole } from '@/hooks/queries/use-users'
import { api } from '@/lib/api'
import type { RoleName } from '@/types/api'

interface UserRow {
  id: string
  email: string
  fullName: string
  role: RoleName
}

const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: () => api.get<UserRow[]>('/users').then((r) => r.data),
    staleTime: 30_000,
  })

export const Route = createFileRoute('/_authenticated/admin/officers')({
  component: OfficersPage,
})

const roleOptions: { value: RoleName; label: string }[] = [
  { value: 'Citizen', label: 'Citizen' },
  { value: 'WardOfficer', label: 'Ward Officer' },
  { value: 'MunicipalOfficer', label: 'Municipal Officer' },
  { value: 'Admin', label: 'Admin' },
]

function OfficersPage() {
  const { data: users = [] } = useQuery(usersQueryOptions())
  const updateRole = useUpdateUserRole()

  async function handleRoleChange(userId: string, role: RoleName) {
    try {
      await updateRole.mutateAsync({ userId, role })
      toast.success('Role updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const columns: ColumnDef<UserRow>[] = [
    { accessorKey: 'fullName', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(val) =>
            val && handleRoleChange(row.original.id, val as RoleName)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Officer Management"
        description="Assign roles to registered users"
      />

      <DataTable
        columns={columns}
        data={users}
        searchColumn="fullName"
        searchPlaceholder="Search users..."
      />
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { OfficerPendingApplicationsTabs } from '@/components/shared/officer-pending-applications-tabs'
import {
  myAssignedApplicationsQueryOptions,
  pendingApplicationsQueryOptions,
} from '@/hooks/queries/use-applications'

export const Route = createFileRoute('/_authenticated/officer/applications')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
      context.queryClient.ensureQueryData(myAssignedApplicationsQueryOptions()),
    ]),
  component: AllApplicationsPage,
})

function AllApplicationsPage() {
  return (
    <OfficerPendingApplicationsTabs
      variant="catalog"
      title="All Active Applications"
    />
  )
}

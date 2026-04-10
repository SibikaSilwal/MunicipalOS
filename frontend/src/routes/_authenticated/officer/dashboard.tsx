import { createFileRoute } from '@tanstack/react-router'
import { OfficerPendingApplicationsTabs } from '@/components/shared/officer-pending-applications-tabs'
import {
  myAssignedApplicationsQueryOptions,
  pendingApplicationsQueryOptions,
} from '@/hooks/queries/use-applications'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/officer/dashboard')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
      context.queryClient.ensureQueryData(myAssignedApplicationsQueryOptions()),
    ]),
  component: OfficerDashboard,
})

function OfficerDashboard() {
  const { t } = useTranslation()
  return (
    <OfficerPendingApplicationsTabs
      variant="dashboard"
      title={t('applications.pendingQueueTitle')}
    />
  )
}

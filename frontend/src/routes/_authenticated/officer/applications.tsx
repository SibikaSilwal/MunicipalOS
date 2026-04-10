import { createFileRoute } from '@tanstack/react-router'
import { OfficerPendingApplicationsTabs } from '@/components/shared/officer-pending-applications-tabs'
import {
  municipalityApplicationsQueryOptions,
  myAssignedApplicationsQueryOptions,
  pendingApplicationsQueryOptions,
} from '@/hooks/queries/use-applications'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/officer/applications')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
      context.queryClient.ensureQueryData(municipalityApplicationsQueryOptions()),
      context.queryClient.ensureQueryData(myAssignedApplicationsQueryOptions()),
    ]),
  component: AllApplicationsPage,
})

function AllApplicationsPage() {
  const { t } = useTranslation()
  return (
    <OfficerPendingApplicationsTabs
      variant="catalog"
      title={t('applications.allApplicationsTitle')}
    />
  )
}

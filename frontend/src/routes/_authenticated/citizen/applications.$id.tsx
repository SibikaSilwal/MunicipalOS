import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkflowProgress } from '@/components/shared/workflow-progress'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatusTimeline } from '@/components/shared/status-timeline'
import { applicationDetailQueryOptions } from '@/hooks/queries/use-applications'
import { formatDate } from '@/lib/utils'
import { Download, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute(
  '/_authenticated/citizen/applications/$id',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      applicationDetailQueryOptions(params.id),
    ),
  component: ApplicationDetailPage,
})

function ApplicationDetailPage() {
  const { t } = useTranslation()
  const { id } = Route.useParams()
  const { data: application, isLoading } = useQuery(
    applicationDetailQueryOptions(id),
  )

  if (isLoading || !application) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  const totalSteps = application.workflowSteps.length || 1
  const currentWfStep = application.workflowSteps.find(
    (s) => s.stepOrder === application.currentStep,
  )
  const friendlyApplicationId = application.friendlyApplicationId

  async function handleDownloadCertificate() {
    const response = await api.get(`/applications/${id}/certificate`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `certificate-${friendlyApplicationId}.pdf`,
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader title={application.friendlyApplicationId}>
        <StatusBadge status={application.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('applications.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.referenceLabel')}
                </p>
                <p className="font-medium font-mono text-sm">
                  {application.friendlyApplicationId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.serviceTypeLabel')}
                </p>
                <p className="font-medium">{application.serviceTypeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.submittedLabel')}
                </p>
                <p className="font-medium">
                  {formatDate(application.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.statusLabel')}
                </p>
                <StatusBadge status={application.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.currentStepLabel')}
                </p>
                <p className="font-medium">
                  {t('applications.stepOfTotal', {
                    n: application.currentStep,
                    m: totalSteps,
                  })}
                  {currentWfStep &&
                    ` — ${currentWfStep.stepName || currentWfStep.roleRequired}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {application.workflowSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('applications.workflowProgressTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowProgress steps={application.workflowSteps} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('applications.documentsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('applications.noDocumentsUploadedWithPeriod')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {application.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.documentName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.uploadedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {application.status === 'Approved' && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleDownloadCertificate}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('applications.downloadCertificate')}
            </Button>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('applications.statusHistoryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline entries={application.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

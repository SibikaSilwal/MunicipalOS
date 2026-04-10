import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatusTimeline } from '@/components/shared/status-timeline'
import { WorkflowProgress } from '@/components/shared/workflow-progress'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { TooltipForDisabledControl } from '@/components/ui/tooltip'
import {
  applicationDetailQueryOptions,
  useApproveApplication,
  useRejectApplication,
  useRequestDocuments,
  usePickUpStep,
  useAssignStep,
  useCompleteStep,
} from '@/hooks/queries/use-applications'
import { useAuth } from '@/hooks/use-auth'
import { municipalityOfficersQueryOptions } from '@/hooks/queries/use-municipalities'
import { formatDate } from '@/lib/utils'
import {
  roleRequiredTooltip,
  userMatchesWorkflowRole,
} from '@/lib/workflow-role'
import {
  CheckCircle,
  XCircle,
  FileQuestion,
  FileText,
  Download,
  Hand,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/officer/review/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      applicationDetailQueryOptions(params.id),
    ),
  component: ReviewPage,
})

type DialogType = 'complete-step' | 'reject' | 'request-docs' | 'assign' | null

function ReviewPage() {
  const { t } = useTranslation()
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: application, isLoading } = useQuery(
    applicationDetailQueryOptions(id),
  )
  const municipalityId = user?.municipalityId ?? ''
  const { data: officers = [] } = useQuery(
    municipalityOfficersQueryOptions(municipalityId),
  )

  const approve = useApproveApplication()
  const reject = useRejectApplication()
  const requestDocs = useRequestDocuments()
  const pickUp = usePickUpStep()
  const assignStep = useAssignStep()
  const completeStep = useCompleteStep()

  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')
  const [selectedOfficerId, setSelectedOfficerId] = useState('')

  if (isLoading || !application) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  const currentWfStep = application.workflowSteps.find(
    (s) => s.stepOrder === application.currentStep,
  )
  const totalSteps = application.workflowSteps.length || 1
  const isLastStep = application.currentStep >= totalSteps
  const isAssignedToMe = currentWfStep?.assignedToUserId === user?.id
  const isUnassigned =
    !currentWfStep?.assignedToUserId &&
    (currentWfStep?.status === 'Pending' ||
      currentWfStep?.status === 'WaitingToBePicked')
  const isAdmin = user?.role === 'Admin'
  const roleMatchesStep = currentWfStep
    ? userMatchesWorkflowRole(user?.role, currentWfStep.roleRequired)
    : false
  const stepAllowsOfficerActions =
    currentWfStep?.status === 'InProgress' ||
    currentWfStep?.status === 'DocumentsRequested'
  const canAct = isAssignedToMe && roleMatchesStep && stepAllowsOfficerActions
  const actionsBlockedByRole =
    isAssignedToMe && stepAllowsOfficerActions && !roleMatchesStep

  const eligibleOfficers = currentWfStep
    ? officers.filter((o) => o.roleName === currentWfStep.roleRequired)
    : officers
  const isTerminal =
    application.status === 'Approved' || application.status === 'Rejected'
  const roleRequiredHint = currentWfStep
    ? roleRequiredTooltip(currentWfStep.roleRequired)
    : ''

  async function handlePickUp() {
    try {
      await pickUp.mutateAsync({ id })
      toast.success(t('applications.stepPickedUpToast'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('applications.pickUpFailed'))
    }
  }

  async function handleAssign() {
    if (!selectedOfficerId) {
      toast.error(t('applications.selectOfficerError'))
      return
    }
    try {
      await assignStep.mutateAsync({ id, officerId: selectedOfficerId })
      toast.success(t('applications.stepAssignedToast'))
      setDialog(null)
      setSelectedOfficerId('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('applications.assignFailed'))
    }
  }

  async function handleAction() {
    try {
      if (dialog === 'complete-step') {
        if (isLastStep) {
          await approve.mutateAsync({ id, comment: comment || undefined })
          toast.success(t('applications.approvedToast'))
        } else {
          await completeStep.mutateAsync({ id, comment: comment || undefined })
          toast.success(t('applications.stepCompletedToast'))
        }
      } else if (dialog === 'reject') {
        if (!comment.trim()) {
          toast.error(t('applications.rejectCommentRequired'))
          return
        }
        await reject.mutateAsync({ id, comment })
        toast.success(t('applications.rejectedToast'))
      } else if (dialog === 'request-docs') {
        if (!comment.trim()) {
          toast.error(t('applications.requestDocsDetailsRequired'))
          return
        }
        await requestDocs.mutateAsync({ id, comment })
        toast.success(t('applications.documentsRequestedToast'))
      }
      setDialog(null)
      setComment('')
      navigate({ to: '/officer/dashboard' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'))
    }
  }

  const isProcessing =
    approve.isPending ||
    reject.isPending ||
    requestDocs.isPending ||
    completeStep.isPending ||
    pickUp.isPending ||
    assignStep.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('applications.reviewTitle')}
        description={application.friendlyApplicationId}
      >
        <StatusBadge status={application.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('applications.applicationInfoTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.applicationLabel')}
                </p>
                <p className="font-medium font-mono text-sm">
                  {application.friendlyApplicationId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('applications.citizenLabel')}
                </p>
                <p className="font-medium">{application.citizenName}</p>
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
              <CardTitle>{t('applications.statusHistoryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline entries={application.statusHistory} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Documents + Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('applications.uploadedDocumentsTitle')}</CardTitle>
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
                        <div>
                          <p className="text-sm font-medium">
                            {doc.documentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Step actions card — only when application is active */}
          {!isTerminal && currentWfStep && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('applications.stepActionsTitle')}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({currentWfStep.stepName || `Step ${currentWfStep.stepOrder}`})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Unassigned: show pick-up + assign */}
                {isUnassigned && (
                  <>
                    <TooltipForDisabledControl
                      active={!roleMatchesStep}
                      label={roleRequiredHint}
                      wrapperClassName="block w-full"
                    >
                      <Button
                        className="w-full"
                        onClick={handlePickUp}
                        disabled={isProcessing || !roleMatchesStep}
                      >
                        <Hand className="mr-2 h-4 w-4" />
                        {pickUp.isPending
                          ? t('applications.pickingUp')
                          : t('applications.pickUpStep')}
                      </Button>
                    </TooltipForDisabledControl>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setDialog('assign')}
                        disabled={isProcessing}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('applications.assignToOfficer')}
                      </Button>
                    )}
                  </>
                )}

                {/* Assigned but not to me — admin can reassign */}
                {currentWfStep.assignedToUserId &&
                  !isAssignedToMe &&
                  isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDialog('assign')}
                      disabled={isProcessing}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('applications.reassignStep')}
                    </Button>
                  )}

                {/* Can act: complete / reject / request docs (or wrong role: disabled + tooltip) */}
                {(canAct || actionsBlockedByRole) && (
                  <div className="space-y-3">
                    <TooltipForDisabledControl
                      active={actionsBlockedByRole}
                      label={roleRequiredHint}
                      wrapperClassName="block w-full"
                    >
                      <Button
                        className="w-full"
                        onClick={() => setDialog('complete-step')}
                        disabled={isProcessing || actionsBlockedByRole}
                      >
                        {isLastStep ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('applications.approveApplication')}
                          </>
                        ) : (
                          <>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            {t('applications.completeStepAndAdvance')}
                          </>
                        )}
                      </Button>
                    </TooltipForDisabledControl>
                    <div className="flex gap-2">
                      <TooltipForDisabledControl
                        active={actionsBlockedByRole}
                        label={roleRequiredHint}
                        wrapperClassName="min-w-0 flex-1"
                      >
                        <Button
                          variant="destructive"
                          className="w-full min-w-0 flex-1"
                          onClick={() => setDialog('reject')}
                          disabled={isProcessing || actionsBlockedByRole}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {t('applications.reject')}
                        </Button>
                      </TooltipForDisabledControl>
                      <TooltipForDisabledControl
                        active={actionsBlockedByRole}
                        label={roleRequiredHint}
                        wrapperClassName="min-w-0 flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full min-w-0 flex-1"
                          onClick={() => setDialog('request-docs')}
                          disabled={isProcessing || actionsBlockedByRole}
                        >
                          <FileQuestion className="mr-2 h-4 w-4" />
                          {t('applications.requestDocs')}
                        </Button>
                      </TooltipForDisabledControl>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setDialog('assign')}
                        disabled={isProcessing}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('applications.reassignStep')}
                      </Button>
                    )}
                  </div>
                )}

                {/* Assigned to me but waiting (shouldn't usually happen, but safe) */}
                {isAssignedToMe &&
                  currentWfStep.status !== 'InProgress' &&
                  currentWfStep.status !== 'DocumentsRequested' && (
                    <p className="text-sm text-muted-foreground text-center">
                      {t('applications.stepAssignedButInState', {
                        state: currentWfStep.status,
                      })}
                    </p>
                  )}
              </CardContent>
            </Card>
          )}

          {isTerminal && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('applications.noFurtherActions', {
                    status: application.status.toLowerCase(),
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Complete Step / Approve dialog */}
      <ConfirmDialog
        open={dialog === 'complete-step'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={
          isLastStep
            ? t('applications.approveApplication')
            : t('applications.completeStepTitle')
        }
        description={
          isLastStep
            ? t('applications.finalStepApproveHelp')
            : t('applications.completeAndAdvanceHelp', {
                step:
                  currentWfStep?.stepName || `Step ${currentWfStep?.stepOrder}`,
              })
        }
        confirmLabel={
          isLastStep
            ? t('applications.approve')
            : t('applications.completeStepConfirm')
        }
        onConfirm={handleAction}
        loading={approve.isPending || completeStep.isPending}
      >
        <div className="space-y-2 py-2">
          <Label>{t('applications.commentOptionalLabel')}</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('applications.addCommentPlaceholder')}
          />
        </div>
      </ConfirmDialog>

      {/* Reject dialog */}
      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('applications.rejectDialogTitle')}
        description={t('applications.rejectDialogDescription')}
        confirmLabel={t('applications.reject')}
        variant="destructive"
        onConfirm={handleAction}
        loading={reject.isPending}
      >
        <div className="space-y-2 py-2">
          <Label>
            {t('applications.rejectReasonLabel')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('applications.rejectReasonPlaceholder')}
            required
          />
        </div>
      </ConfirmDialog>

      {/* Request docs dialog */}
      <ConfirmDialog
        open={dialog === 'request-docs'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t('applications.requestDocumentsDialogTitle')}
        description={t('applications.requestDocumentsDialogDescription')}
        confirmLabel={t('applications.sendRequest')}
        onConfirm={handleAction}
        loading={requestDocs.isPending}
      >
        <div className="space-y-2 py-2">
          <Label>
            {t('applications.requestDocumentsDetailsLabel')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('applications.requestDocumentsDetailsPlaceholder')}
            required
          />
        </div>
      </ConfirmDialog>

      {/* Assign step dialog */}
      <ConfirmDialog
        open={dialog === 'assign'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
            setSelectedOfficerId('')
          }
        }}
        title={t('applications.assignStepDialogTitle')}
        description={t('applications.assignStepDialogDescription', {
          step: currentWfStep?.stepName || `Step ${currentWfStep?.stepOrder}`,
        })}
        confirmLabel={t('applications.assign')}
        onConfirm={handleAssign}
        loading={assignStep.isPending}
      >
        <div className="space-y-2 py-2">
          <Label>{t('applications.selectOfficerLabel')}</Label>
          {!municipalityId && (
            <p className="text-sm text-destructive">
              {t('applications.missingMunicipalitySession')}
            </p>
          )}
          {municipalityId && officers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('applications.noOfficersFound')}
            </p>
          )}
          {municipalityId &&
            officers.length > 0 &&
            eligibleOfficers.length === 0 &&
            currentWfStep && (
              <p className="text-sm text-muted-foreground">
                {t('applications.noEligibleOfficersForRole', {
                  role: currentWfStep.roleRequired,
                })}
              </p>
            )}
          <Select
            value={selectedOfficerId}
            onValueChange={(val) => setSelectedOfficerId(val ?? '')}
            disabled={!municipalityId || eligibleOfficers.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('applications.chooseOfficerPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {eligibleOfficers.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.fullName} ({o.roleName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ConfirmDialog>
    </div>
  )
}

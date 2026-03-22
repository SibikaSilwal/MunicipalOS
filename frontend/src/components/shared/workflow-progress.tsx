import { Check, User, AlertCircle } from 'lucide-react'
import type { ApplicationWorkflowStepDto, ApplicationStepStatus } from '@/types/api'
import { cn, formatDateTime } from '@/lib/utils'

interface WorkflowProgressProps {
  steps: ApplicationWorkflowStepDto[]
  className?: string
}

export function WorkflowProgress({ steps, className }: WorkflowProgressProps) {
  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)

  return (
    <div className={cn('space-y-0', className)}>
      {sorted.map((step, i) => {
        const isLast = i === sorted.length - 1

        return (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepCircle status={step.status} index={step.stepOrder} />
              {!isLast && <StepConnector status={step.status} />}
            </div>

            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'Pending' && 'text-muted-foreground',
                  )}
                >
                  {step.stepName || `Step ${step.stepOrder}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  — {step.roleRequired}
                </span>
              </div>

              {step.stepDescription && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.stepDescription}
                </p>
              )}

              {/* Per-step progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    step.status === 'Completed' && 'w-full bg-success',
                    step.status === 'Rejected' && 'w-full bg-destructive',
                    (step.status === 'InProgress' || step.status === 'WaitingToBePicked') &&
                      'w-1/2 bg-primary',
                    step.status === 'DocumentsRequested' && 'w-1/2 bg-warning',
                    step.status === 'Pending' && 'w-0',
                  )}
                />
              </div>

              {/* Assignment / completion metadata */}
              <div className="mt-1.5 space-y-0.5">
                <StepStatusLabel status={step.status} />

                {step.assignedToUserName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>
                      Assigned to <span className="font-medium text-foreground">{step.assignedToUserName}</span>
                      {step.assignedOn && ` · ${formatDateTime(step.assignedOn)}`}
                    </span>
                  </div>
                )}

                {step.completedByUserName && step.completedOn && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-success" />
                    <span>
                      Completed by <span className="font-medium text-foreground">{step.completedByUserName}</span>
                      {` · ${formatDateTime(step.completedOn)}`}
                    </span>
                  </div>
                )}

                {step.comment && (
                  <p className="text-xs text-muted-foreground italic">
                    &ldquo;{step.comment}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StepCircle({ status, index }: { status: ApplicationStepStatus; index: number }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
        status === 'Completed' && 'bg-success text-success-foreground',
        status === 'Rejected' && 'bg-destructive text-white',
        (status === 'InProgress' || status === 'WaitingToBePicked') &&
          'bg-primary text-primary-foreground',
        status === 'DocumentsRequested' && 'bg-warning text-warning-foreground',
        status === 'Pending' &&
          'border-2 border-muted-foreground/30 text-muted-foreground',
      )}
    >
      {status === 'Completed' ? (
        <Check className="h-4 w-4" />
      ) : status === 'Rejected' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        index
      )}
    </div>
  )
}

function StepConnector({ status }: { status: ApplicationStepStatus }) {
  return (
    <div
      className={cn(
        'w-0.5 flex-1 min-h-6 transition-colors',
        status === 'Completed' ? 'bg-success' : 'bg-muted',
      )}
    />
  )
}

function StepStatusLabel({ status }: { status: ApplicationStepStatus }) {
  const config: Record<ApplicationStepStatus, { label: string; className: string }> = {
    Pending: { label: 'Not started', className: 'text-muted-foreground' },
    WaitingToBePicked: { label: 'Waiting to be picked up', className: 'text-primary' },
    InProgress: { label: 'In progress', className: 'text-primary' },
    DocumentsRequested: { label: 'Documents requested', className: 'text-warning' },
    Completed: { label: 'Completed', className: 'text-success' },
    Rejected: { label: 'Rejected', className: 'text-destructive' },
  }

  const c = config[status]
  return <p className={cn('text-[11px] font-medium', c.className)}>{c.label}</p>
}

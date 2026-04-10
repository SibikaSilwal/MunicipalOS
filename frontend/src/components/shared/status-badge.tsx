import { Badge } from '@/components/ui/badge'
import type { ApplicationStatus } from '@/types/api'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  Submitted: {
    label: 'applications.status.submitted',
    className: 'border border-border bg-muted text-muted-foreground',
  },
  UnderReview: {
    label: 'applications.status.underReview',
    className: 'bg-warning text-warning-foreground',
  },
  Approved: {
    label: 'applications.status.approved',
    className: 'bg-success text-success-foreground',
  },
  Rejected: {
    label: 'applications.status.rejected',
    className: 'bg-destructive text-destructive-foreground',
  },
  DocumentsRequested: {
    label: 'applications.status.docsRequested',
    className: 'border-primary text-primary bg-transparent',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  const config = statusConfig[status]
  return (
    <Badge className={cn(config.className, className)}>
      {t(config.label)}
    </Badge>
  )
}

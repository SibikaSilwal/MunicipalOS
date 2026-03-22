import { CheckCircle, Clock, Circle } from 'lucide-react'
import type { StatusHistoryEntry } from '@/types/api'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StatusTimelineProps {
  entries: StatusHistoryEntry[]
  className?: string
}

export function StatusTimeline({ entries, className }: StatusTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )

  return (
    <div className={cn('space-y-0', className)}>
      {sorted.map((entry, index) => {
        const isLatest = index === 0
        const isLast = index === sorted.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="mt-1">
                {isLatest ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : entry.status === 'Approved' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border min-h-6" />
              )}
            </div>
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p className="text-sm font-medium">{entry.status}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.changedAt)} &middot; by {entry.changedBy}
              </p>
              {entry.comment && (
                <p className="mt-1 text-sm text-muted-foreground italic">
                  &ldquo;{entry.comment}&rdquo;
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

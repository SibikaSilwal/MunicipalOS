export function formatSlaMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—'
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return `${days} day${days === 1 ? '' : 's'}`
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} hr${hours === 1 ? '' : 's'}`
  }
  return `${minutes} min`
}

export const SLA_DAY_OPTIONS = Array.from({ length: 60 }, (_, i) => (i + 1) * 0.5)

export function formatSlaDays(days: number): string {
  const normalized = Number.isInteger(days) ? `${days}` : `${days.toFixed(1)}`
  return `${normalized} days`
}

export function parseSlaDaysToMinutes(input: string): {
  value?: number
  error?: string
} {
  const normalized = input.trim()
  if (!normalized) return {}

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return { error: 'Expected completion must be a number of days' }
  }
  if (parsed < 0.5 || parsed > 30) {
    return { error: 'Expected completion must be between 0.5 and 30 days' }
  }
  if (parsed * 2 !== Math.floor(parsed * 2)) {
    return { error: 'Expected completion must be in 0.5 day increments' }
  }

  return { value: Math.round(parsed * 24 * 60) }
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return format(parseISO(dateString), 'MMM d, yyyy')
}

export function formatDateTime(dateString: string) {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
}

export function formatRelative(dateString: string) {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

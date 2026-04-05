import type { RoleName } from '@/types/api'

const ROLE_LABEL: Record<string, string> = {
  WardOfficer: 'Ward Officer',
  MunicipalOfficer: 'Municipal Officer',
  Citizen: 'Citizen',
  Admin: 'Admin',
}

/** Tooltip for disabled controls when the signed-in user's role does not match the step. */
export function roleRequiredTooltip(roleRequired: string): string {
  const label = ROLE_LABEL[roleRequired] ?? roleRequired
  return `${label} role required`
}

export function userMatchesWorkflowRole(
  userRole: RoleName | string | undefined,
  roleRequired: string,
): boolean {
  if (!userRole) return false
  return userRole === roleRequired
}

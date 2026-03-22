export type RoleName = 'Citizen' | 'WardOfficer' | 'MunicipalOfficer' | 'Admin'

export type ApplicationStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'DocumentsRequested'

export interface User {
  id: string
  email: string
  fullName: string
  role: RoleName
  municipalityId: string
  createdAt: string
}

export interface Application {
  id: string
  citizenId: string
  serviceTypeId: string
  status: ApplicationStatus
  currentStep: number
  submittedAt: string
}

export interface ApplicationSummary {
  id: string
  serviceTypeId: string
  serviceTypeName: string
  status: ApplicationStatus
  currentStep: number
  submittedAt: string
}

export type ApplicationStepStatus =
  | 'Pending'
  | 'WaitingToBePicked'
  | 'InProgress'
  | 'DocumentsRequested'
  | 'Completed'
  | 'Rejected'

export interface ApplicationWorkflowStepDto {
  id: string
  stepOrder: number
  stepName: string
  stepDescription: string | null
  roleRequired: string
  status: ApplicationStepStatus
  assignedToUserId: string | null
  assignedToUserName: string | null
  assignedOn: string | null
  completedByUserId: string | null
  completedByUserName: string | null
  completedOn: string | null
  comment: string | null
}

export interface ApplicationDetail {
  id: string
  citizenId: string
  citizenName: string
  serviceTypeId: string
  serviceTypeName: string
  status: ApplicationStatus
  currentStep: number
  submittedAt: string
  documents: ApplicationDocument[]
  statusHistory: StatusHistoryEntry[]
  workflowSteps: ApplicationWorkflowStepDto[]
}

export interface ServiceType {
  id: string
  name: string
  description: string | null
  municipalityId: string
  requiredDocuments: RequiredDocument[]
}

export interface RequiredDocument {
  id: string
  name: string
  required: boolean
}

export interface WorkflowDefinition {
  id: string
  serviceTypeId: string
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  stepOrder: number
  roleRequired: RoleName
  stepName: string
  stepDescription: string | null
}

export interface ApplicationDocument {
  id: string
  applicationId: string
  documentName: string
  filePath: string
  uploadedAt: string
}

export interface StatusHistoryEntry {
  id: string
  status: ApplicationStatus
  changedBy: string
  changedAt: string
  comment: string | null
}

export interface AuditLogEntry {
  id: string
  eventType: string
  userId: string
  applicationId: string | null
  timestamp: string
  metadata: Record<string, unknown> | null
}

export interface Notification {
  id: string
  message: string
  isRead: boolean
  sentAt: string
}

export interface Municipality {
  id: string
  name: string
}

/** GET /api/municipalities/{municipalityId}/officers */
export interface MunicipalityOfficer {
  id: string
  fullName: string
  roleName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  municipalityId: string
  roleId: string
}

export interface RegisterResponse {
  userId: string
  token: string
}

export interface CurrentUserDto {
  id: string
  email: string
  fullName: string
  role: string | null
  municipality: string | null
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

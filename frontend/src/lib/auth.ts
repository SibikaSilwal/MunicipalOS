import { api } from './api'
import { useAuthStore } from '@/stores/auth-store'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CurrentUserDto,
  RoleName,
} from '@/types/api'

export async function loginUser(credentials: LoginRequest) {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)
  const token = data.token

  useAuthStore.getState().login(token, {
    id: '',
    email: credentials.email,
    fullName: '',
    role: 'Citizen',
    municipalityId: '',
  })

  const user = await fetchCurrentUser()
  useAuthStore.getState().login(token, user)
  return { token, user }
}

export async function registerUser(req: RegisterRequest) {
  const { data } = await api.post<RegisterResponse>('/auth/register', req)
  const token = data.token

  useAuthStore.getState().login(token, {
    id: data.userId,
    email: req.email,
    fullName: req.fullName,
    role: 'Citizen',
    municipalityId: req.municipalityId,
  })

  const user = await fetchCurrentUser()
  useAuthStore.getState().login(token, user)
  return { token, user }
}

function parseMunicipalityIdFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!))
    return payload.municipalityId ?? ''
  } catch {
    return ''
  }
}

export async function fetchCurrentUser() {
  const token = useAuthStore.getState().token
  const { data } = await api.get<CurrentUserDto>('/auth/me')
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    role: (data.role ?? 'Citizen') as RoleName,
    municipalityId: token ? parseMunicipalityIdFromToken(token) : '',
  }
}

export function logoutUser() {
  useAuthStore.getState().logout()
}

export function getRoleDashboard(role: RoleName): string {
  switch (role) {
    case 'Admin':
      return '/admin/services'
    case 'WardOfficer':
    case 'MunicipalOfficer':
      return '/officer/dashboard'
    case 'Citizen':
    default:
      return '/citizen/dashboard'
  }
}

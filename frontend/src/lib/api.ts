import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (error.response && error.response.status >= 500) {
        toast.error('Server error. Please try again later.')
      }

      const message =
        error.response?.data?.error ??
        error.response?.data?.message ??
        error.message
      return Promise.reject(new Error(message))
    }
    toast.error('An unexpected network error occurred.')
    return Promise.reject(error)
  },
)

import { apiClient } from '#/config/axios'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const googleAuthEndpoint = `${apiBaseUrl}/auth/google`

type AuthResponse = {
  token: string
  user: { id: string; name: string; email: string }
}

type ApiResponse<T> = {
  success: boolean
  data: T
  message: string
}

async function authenticateWithCredentials(
  path: 'login' | 'register',
  payload: Record<string, string>,
) {
  const { data: result } = await apiClient.post<ApiResponse<AuthResponse>>(
    `/auth/${path}`,
    payload,
  )
  if (!result.success)
    throw new Error(result.message || 'Authentication failed')
  return result.data
}

export type CurrentUser = {
  id: string
  name: string
  email: string
}

export async function getCurrentUser() {
  const { data: result } =
    await apiClient.get<ApiResponse<CurrentUser>>('/auth/me')
  if (!result.success)
    throw new Error(result.message || 'Unable to retrieve current user')
  return result.data
}

export function login(payload: Record<string, string>) {
  return authenticateWithCredentials('login', payload)
}

export function register(payload: Record<string, string>) {
  return authenticateWithCredentials('register', payload)
}

export function redirectToGoogleAuth(loginHint?: string) {
  const url = new URL(googleAuthEndpoint, window.location.origin)
  if (loginHint) {
    url.searchParams.set('login_hint', loginHint)
  } else {
    url.searchParams.set('prompt', 'select_account')
  }
  window.location.assign(url.toString())
}

export async function exchangeGoogleCode(code: string, state: string) {
  const url = new URL(
    `${apiBaseUrl}/auth/google/callback`,
    window.location.origin,
  )
  url.searchParams.set('code', code)
  url.searchParams.set('state', state)

  const { data: result } = await apiClient.get<ApiResponse<AuthResponse>>(
    url.pathname + url.search,
  )
  if (!result.success)
    throw new Error(result.message || 'Google authentication failed')
  return result.data
}

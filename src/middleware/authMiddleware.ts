import { redirect } from '@tanstack/react-router'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export async function hasAuthSession() {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      credentials: 'include',
    })
    if (!response.ok) return false
    const result = (await response.json()) as { success?: boolean }
    return result.success === true
  } catch {
    return false
  }
}

export async function authMiddleware() {
  if (typeof window === 'undefined') return

  if (await hasAuthSession()) return

  throw redirect({ to: '/auth/login' })
}

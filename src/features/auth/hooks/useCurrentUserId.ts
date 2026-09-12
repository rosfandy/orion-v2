import { useCurrentUser } from '#/features/auth/hooks/useCurrentUser'

/**
 * Returns the authenticated user id, or undefined if not yet resolved.
 * Internally uses React Query to fetch /auth/me once; if the caller's
 * session is already loaded by AppLayout they can skip this hook and
 * pass userId directly.
 */
export function useCurrentUserId(): string | undefined {
  const currentUser = useCurrentUser()
  return currentUser?.id
}

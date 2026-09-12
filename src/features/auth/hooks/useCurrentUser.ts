import { useQuery } from '@tanstack/react-query'
import type { CurrentUser } from '#/features/auth/services/authService'
import { getCurrentUser } from '#/features/auth/services/authService'

export function useCurrentUser(): CurrentUser | undefined {
  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 0,
    retry: false,
  })

  return query.data ?? undefined
}

import { useMutation } from '@tanstack/react-query'
import { redirectToGoogleAuth } from '#/features/auth/services/authService'

export function useGoogleAuth() {
  const mutation = useMutation({
    mutationFn: async (loginHint?: string) => redirectToGoogleAuth(loginHint),
  })

  return { authenticate: mutation.mutate, isLoading: mutation.isPending }
}

import { useMutation } from '@tanstack/react-query'

export function useLogout() {
  const mutation = useMutation({
    mutationFn: async () => {
      window.localStorage.removeItem('token')
      window.localStorage.removeItem('user')
      window.location.assign('/auth/login')
    },
  })

  return { logout: mutation.mutate, isLoading: mutation.isPending }
}

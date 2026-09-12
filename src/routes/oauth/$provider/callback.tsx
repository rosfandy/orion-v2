import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '#/components/ui/Button'
import { hasAuthSession } from '#/middleware/authMiddleware'
import { getCurrentUser } from '#/features/auth/services/authService'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { provider = 'provider' } = useParams<{ provider: string }>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorMessage = params.get('error')

    if (errorMessage) {
      setError(errorMessage)
      return
    }

    if (params.get('success') !== 'true') {
      setError('OAuth sign in was not completed')
      return
    }

    let cancelled = false

    hasAuthSession().then(async (authenticated) => {
      if (cancelled) return
      if (!authenticated) {
        setError('Unable to verify your sign-in session')
        return
      }
      try {
        const user = await getCurrentUser()
        window.localStorage.setItem('user', JSON.stringify(user))
      } catch {
        setError('Unable to retrieve your account')
        return
      }
      window.location.assign('/')
    })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-sans text-on-surface">
      <section className="w-full max-w-[420px] rounded-xl bg-surface-container-lowest p-8 text-center shadow-lg sm:p-10">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">Unable to sign in</h1>
            <p className="mt-2 text-body-sm text-on-surface-variant">{error}</p>
            <Button
              className="mt-6"
              onClick={() => navigate('/auth/login')}
            >
              Back to login
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <h1 className="text-2xl font-semibold">
              Completing {provider} sign in
            </h1>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Please wait while we finish setting up your session.
            </p>
          </>
        )}
      </section>
    </main>
  )
}

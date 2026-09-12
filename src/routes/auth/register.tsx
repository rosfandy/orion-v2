import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Form } from '#/components/fragment/Form'
import { Button } from '#/components/ui/Button'
import { Input } from '#/components/ui/Input'
import { GithubAuth, GoogleAuth } from '#/features/auth/components'
import { register } from '#/features/auth/services/authService'

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="text-on-surface-variant hover:text-on-surface"
      onClick={onToggle}
    >
      {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
    </button>
  )
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(at_0%_0%,#ffe8f0_0,transparent_50%),radial-gradient(at_100%_0%,#e5f0ff_0,transparent_50%),radial-gradient(at_50%_100%,#fff_0,transparent_50%)] px-4 py-8 font-sans text-on-surface">
      <section className="w-full max-w-[420px] rounded-xl bg-surface-container-lowest p-8 shadow-lg sm:p-10">
        <header className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
          <p className="text-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <a href="/auth/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </header>

        <div className="mb-6 space-y-3">
          <GoogleAuth />
          <GithubAuth />
        </div>
        <div className="mb-6 flex items-center">
          <div className="flex-grow border-t border-outline-variant" />
          <span className="mx-4 text-body-sm text-on-surface-variant">or</span>
          <div className="flex-grow border-t border-outline-variant" />
        </div>

        <Form
          className="space-y-3"
          onFinish={async (values) => {
            setIsLoading(true)
            setError(null)
            try {
              const data = await register({
                name: String(values.name ?? ''),
                email: String(values.email ?? ''),
                password: String(values.password ?? ''),
                confirmationPassword: String(
                  values.confirmationPassword ?? '',
                ),
              })
              window.localStorage.setItem('token', data.token)
              window.localStorage.setItem('user', JSON.stringify(data.user))
              void navigate('/', { replace: true })
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : 'Unable to register',
              )
            } finally {
              setIsLoading(false)
            }
          }}
        >
          <Form.Item
            name="name"
            label="Full name"
            rules={[{ required: true, message: 'Full name is required' }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Work email"
            rules={[
              { required: true, message: 'Email required' },
              { type: 'email' },
            ]}
          >
            <Input type="email" placeholder="Work email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password required' }]}
          >
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              trailing={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              }
            />
          </Form.Item>
          <Form.Item
            name="confirmationPassword"
            label="Confirmation password"
            rules={[
              { required: true, message: 'Please confirm your password.' },
              {
                validator: (value, values) =>
                  value !== values.password
                    ? 'Passwords do not match.'
                    : undefined,
              },
            ]}
          >
            <Input
              id="reg-confirm-password"
              type={showConfirmation ? 'text' : 'password'}
              placeholder="Confirmation password"
              trailing={
                <PasswordToggle
                  visible={showConfirmation}
                  onToggle={() => setShowConfirmation((visible) => !visible)}
                />
              }
            />
          </Form.Item>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Button type="submit" loading={isLoading} className="mt-2 w-full">
            Create account
          </Button>
        </Form>
      </section>
    </main>
  )
}
function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10">
      <path
        d="m24 10 12 12-5.66 5.66L24 21.31l-6.34 6.35L12 22l12-12Z"
        fill="#ff5f58"
      />
      <path
        d="m12 26 5.66-5.66L24 26.69l6.34-6.35L36 26 24 38 12 26Z"
        fill="#2e79f3"
      />
    </svg>
  )
}

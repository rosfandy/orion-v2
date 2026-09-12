import type { ReactNode } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '#/components/ui/Button'
import type { ButtonProps } from '#/components/ui/Button'
import { useGoogleAuth } from '#/features/auth/hooks/useGoogleAuth'
import { cn } from '#/lib/cn'

export type GoogleAuthProps = Omit<ButtonProps, 'children'> & {
  children?: ReactNode
}

export function GoogleAuth({
  children = 'Continue with Google',
  className,
  onClick,
  disabled,
  ...props
}: GoogleAuthProps) {
  const { authenticate, isLoading } = useGoogleAuth()

  return (
    <div className="w-full">
      <Button
        variant="secondary"
        icon={FcGoogle}
        className={cn('w-full', className)}
        loading={isLoading}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        onClick={(event) => {
          onClick?.(event)
          authenticate()
        }}
        {...props}
      >
        {isLoading ? 'Connecting...' : children}
      </Button>
    </div>
  )
}

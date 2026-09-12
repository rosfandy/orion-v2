import type { ReactNode } from 'react'
import { FaGithub } from 'react-icons/fa'
import { Button } from '#/components/ui/Button'
import type { ButtonProps } from '#/components/ui/Button'
import { cn } from '#/lib/cn'

export type GithubAuthProps = Omit<ButtonProps, 'children'> & { children?: ReactNode }

export function GithubAuth({ children = 'Continue with GitHub', className, ...props }: GithubAuthProps) {
  return (
    <Button
      variant="secondary"
      icon={FaGithub}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

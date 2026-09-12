import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

const variants = {
  primary: 'bg-secondary-container/10 text-secondary',
  neutral: 'bg-surface-container-high text-on-surface-variant',
} as const

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants
}

export function Tag({ className, variant = 'primary', children, ...props }: TagProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

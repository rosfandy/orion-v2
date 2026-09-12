import { useEffect, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { gsap } from 'gsap'
import { cn } from '#/lib/cn'

function ErrorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5.25a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0v-4.5a1 1 0 0 1 1-1Zm0 10a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
    </svg>
  )
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  trailing?: ReactNode
}

export function Input({
  id,
  label,
  error,
  trailing,
  disabled,
  className,
  ...props
}: InputProps) {
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!error || !errorRef.current) return

    const animation = gsap.from(errorRef.current, {
      opacity: 0,
      y: -4,
      duration: 0.25,
      ease: 'power2.out',
    })

    return () => {
      animation.kill()
    }
  }, [error])

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={id} className="text-label-md text-on-surface">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors placeholder:text-sm placeholder:text-on-surface-variant/60',
            error
              ? 'border-error pr-10 focus:border-error focus:ring-1 focus:ring-error'
              : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary',
            disabled &&
              'cursor-not-allowed bg-surface text-on-surface-variant opacity-60',
            trailing && 'pr-10',
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-error">
            <ErrorIcon />
          </span>
        ) : trailing ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </span>
        ) : null}
      </div>
      {error ? (
        <p
          ref={errorRef}
          id={`${id}-error`}
          className="text-error-text text-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { MdClose } from 'react-icons/md'
import { Button } from './Button'
import { cn } from '#/lib/cn'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  hideHeader?: boolean
  ariaLabel?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  contentClassName,
  hideHeader = false,
  ariaLabel,
}: ModalProps) {
  const [mounted, setMounted] = useState(open)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }

    if (!mounted || !overlayRef.current || !contentRef.current) return

    const animation = gsap.to([overlayRef.current, contentRef.current], {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => setMounted(false),
    })

    return () => {
      animation.kill()
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open || !mounted || !overlayRef.current || !contentRef.current) return

    const animation = gsap.fromTo(
      [overlayRef.current, contentRef.current],
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power2.out' },
    )
    gsap.fromTo(
      contentRef.current,
      { y: 12, scale: 0.98 },
      { y: 0, scale: 1, duration: 0.25, ease: 'power2.out' },
    )

    return () => {
      animation.kill()
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!mounted) return null

  return (
    <div
      className="fixed z-[1000] flex items-center justify-center p-5"
      style={{ inset: 0 }}
    >
      <div
        ref={overlayRef}
        className="absolute bg-on-background/40 backdrop-blur-sm"
        style={{ inset: 0 }}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title && !hideHeader ? 'modal-title' : undefined}
        className={cn(
          'relative z-[1001] w-full max-w-lg rounded-xl border border-slate-200 bg-surface-container-lowest p-6 shadow-2xl',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {!hideHeader ? (
          <header className="mb-5 flex items-center justify-between gap-4">
            {title ? (
              <h2 id="modal-title" className="text-label-lg text-on-surface">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <Button
              icon={MdClose}
              iconOnly
              variant="ghost"
              size="sm"
              aria-label="Close modal"
              onClick={onClose}
            />
          </header>
        ) : null}
        <div className={contentClassName}>{children}</div>
      </section>
    </div>
  )
}

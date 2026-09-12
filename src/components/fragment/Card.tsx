import type { ReactNode } from 'react'
import { MdGroup } from 'react-icons/md'
import { Avatar } from '#/components/ui/Avatar'
import { Button } from '#/components/ui/Button'
import { Tag } from '#/components/ui/Tag'
import { cn } from '#/lib/cn'

export type CardProps = {
  name: string
  description: string
  members: number
  plan: string
  accentClassName?: string
  planClassName?: string
  onOpen?: () => void
  children?: ReactNode
}

export function Card({
  name,
  description,
  members,
  plan,
  accentClassName = 'bg-primary-container text-on-primary-container',
  planClassName,
  onOpen,
  children,
}: CardProps) {
  return (
    <article
      className="group flex min-h-52 cursor-pointer flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      role="link"
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (onOpen && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <Avatar
          alt={`${name} workspace`}
          fallback={name.slice(0, 1)}
          size="md"
          className={cn('rounded-lg text-display-title', accentClassName)}
        />
        <Tag variant={planClassName ? undefined : plan === 'Pro' ? 'primary' : 'neutral'} className={planClassName}>
          {plan}
        </Tag>
      </div>
      <div className="mb-4 flex-1">
        <h3 className="text-label-lg font-semibold text-on-surface transition-colors group-hover:text-primary">{name}</h3>
        <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{description}</p>
        {children}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-3">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <MdGroup aria-hidden="true" className="size-[18px]" />
          <span className="text-body-sm">{members} members</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.()
          }}
          className="px-3"
        >
          Open
        </Button>
      </div>
    </article>
  )
}

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { MdArrowForward, MdDescription, MdSearch } from 'react-icons/md'
import { Button } from './Button'
import type { ButtonProps } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { cn } from '#/lib/cn'

export type SearchProps = {
  children?: ReactNode
  className?: string
  placeholder?: string
  modalTitle?: ReactNode
  buttonProps?: Omit<ButtonProps, 'children' | 'onClick'>
  onSearch?: (query: string) => void
}

const defaultResults = [
  {
    title: 'Getting started with Luminous',
    section: 'Guides',
    icon: MdDescription,
  },
  {
    title: 'Button component',
    section: 'Components / UI',
    icon: MdDescription,
  },
  {
    title: 'Workspace navigation',
    section: 'Components / Fragments',
    icon: MdDescription,
  },
]

function matchesQuery(title: string, query: string) {
  return title.toLowerCase().includes(query.toLowerCase())
}

export function Search({
  children,
  className,
  placeholder = 'Search anything...',
  modalTitle = 'Search',
  buttonProps,
  onSearch,
}: SearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch?.(query)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  return (
    <div className={cn('inline-block', className)}>
      <Button
        {...buttonProps}
        variant={buttonProps?.variant ?? 'secondary'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'w-full justify-between rounded-full border-slate-200 bg-surface-container-lowest px-3 font-normal text-xs text-on-surface-variant hover:border-primary hover:bg-surface-container-low hover:text-on-surface',
          buttonProps?.className,
        )}
        onClick={() => handleOpenChange(true)}
      >
        <span className="flex items-center gap-2">
          <MdSearch className="size-5" />
          <span>Search</span>
        </span>
        <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-xs font-normal text-on-surface-variant">
          ⌘K
        </kbd>
      </Button>
      <Modal
        open={open}
        onClose={() => handleOpenChange(false)}
        title={modalTitle}
        hideHeader
        ariaLabel="Search"
        className="max-h-[calc(100vh-2.5rem)] min-h-[360px] max-w-2xl overflow-hidden p-0"
        contentClassName="p-0"
      >
        <form onSubmit={handleSubmit} className="flex min-h-[358px] flex-col">
          <div className="relative border-b border-slate-200 px-4 py-3">
            <MdSearch className="pointer-events-none absolute left-7 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              aria-label="Search query"
              className="h-10 border-0 bg-transparent pl-10 pr-24 text-body-md shadow-none focus:ring-0"
              trailing={
                <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-on-surface-variant">
                  Esc
                </kbd>
              }
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {children ??
              (query ? (
                defaultResults
                  .filter((result) => matchesQuery(result.title, query))
                  .map((result) => (
                    <SearchResult key={result.title} {...result} />
                  ))
              ) : (
                <>
                  <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Recent
                  </p>
                  {defaultResults.slice(0, 2).map((result) => (
                    <SearchResult key={result.title} {...result} />
                  ))}
                </>
              ))}
            {query &&
            !children &&
            !defaultResults.some((result) =>
              matchesQuery(result.title, query),
            ) ? (
              <p className="px-3 py-8 text-center text-body-sm text-on-surface-variant">
                No results for &quot;{query}&quot;
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-on-surface-variant">
            <span>Search your workspace</span>
            <span className="flex items-center gap-3">
              <span>
                <kbd className="rounded border border-slate-200 px-1">↑</kbd>{' '}
                <kbd className="rounded border border-slate-200 px-1">↓</kbd> to
                navigate
              </span>
              <span>
                <kbd className="rounded border border-slate-200 px-1">↵</kbd> to
                select
              </span>
            </span>
          </footer>
        </form>
      </Modal>
    </div>
  )
}

function SearchResult({
  title,
  section,
  icon: Icon,
}: {
  title: string
  section: string
  icon: typeof MdDescription
}) {
  return (
    <button
      type="button"
      role="option"
      className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-container"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-container text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-on-surface">{title}</span>
        <span className="block truncate text-xs text-on-surface-variant">
          {section}
        </span>
      </span>
      <MdArrowForward className="size-4 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

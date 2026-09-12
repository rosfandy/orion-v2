import { useState } from 'react'
import type { MemberOption } from '#/features/workspace/components/listtasks/u5'
import { Avatar } from '#/components/ui/Avatar'
import { DropdownPopover } from './Popover'
import { cn } from '#/lib/cn'

/** @deprecated Use {@link MemberOption} from workspace members instead. Kept for local imports that reference `Assignee`. */
export type Assignee = {
  id: string
  name: string
  color?: string
}

export type AssigneesDropdownProps = {
  value?: string[]
  defaultValue?: string[]
  placeholder?: string
  /** Workspace members rendered as assignee options. Must come from `workspace.members` via `workspaceToMemberOptions` or `useWorkspaceMembers`. Hardcoded/mock options are no longer supported. */
  assignees: MemberOption[]
  onChange?: (value: string[]) => void
  triggerClassName?: string
  contentClassName?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AssigneesDropdown({
  value,
  defaultValue = [],
  placeholder = 'Assignees',
  assignees,
  onChange,
  triggerClassName,
  contentClassName,
}: AssigneesDropdownProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue)
  const [query, setQuery] = useState('')
  const current = isControlled ? value : internalValue
  const selected = assignees.filter((assignee) => current.includes(assignee.id))
  const visible = selected.slice(0, 2)
  const overflowCount = selected.length - visible.length
  const filtered = query.trim()
    ? assignees.filter((assignee) => assignee.name.toLowerCase().includes(query.trim().toLowerCase()))
    : assignees

  function commit(next: string[]) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function toggle(assigneeId: string) {
    if (current.includes(assigneeId)) {
      commit(current.filter((id) => id !== assigneeId))
    } else {
      commit([...current, assigneeId])
    }
  }

  return (
    <DropdownPopover
      ariaLabel="Set assignees"
      triggerClassName={cn(
        'inline-flex items-center rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        triggerClassName,
      )}
      contentClassName={cn(
        'w-[300px] overflow-hidden rounded-lg border border-slate-200/80 bg-white font-sans shadow-xl shadow-slate-300/40',
        contentClassName,
      )}
      trigger={
        selected.length > 0 ? (
          <span className="flex items-center -space-x-1">
            {visible.map((assignee) => (
              <Avatar
                key={assignee.id}
                size="sm"
                fallback={getInitials(assignee.name)}
                className="size-6 text-[10px] font-bold text-white ring-2 ring-surface-container-lowest"
                alt={assignee.name}
                style={{ backgroundColor: assignee.color }}
              />
            ))}
            {overflowCount > 0 ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold text-slate-600 ring-2 ring-surface-container-lowest">
                +{overflowCount}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="size-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-slate-400">{placeholder}</span>
          </span>
        )
      }
    >
      <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <svg
          aria-hidden="true"
          className="size-3.5 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name..."
          autoComplete="off"
          className="w-full border-0 bg-transparent p-0 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </header>
      <section aria-label="Assignees" className="py-2">
        <div className="px-3 pt-0.5 pb-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Assignees</span>
        </div>
        <ul aria-label="Assignees list" className="space-y-0.5" role="listbox">
          {filtered.map((assignee) => {
            const active = current.includes(assignee.id)
            return (
              <li
                key={assignee.id}
                aria-selected={active}
                className={cn(
                  'flex cursor-pointer items-center justify-between px-3 py-1.5 transition-colors group',
                  active ? 'bg-slate-50/80 hover:bg-slate-100' : 'hover:bg-slate-50',
                )}
                role="option"
                onClick={() => toggle(assignee.id)}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    size="sm"
                    fallback={getInitials(assignee.name)}
                    className="size-6 shrink-0 text-[10px] font-bold text-white"
                    alt={assignee.name}
                    style={{ backgroundColor: assignee.color ?? '#2563eb' }}
                  />
                  <span className="truncate text-[13px] font-medium text-slate-800">{assignee.name}</span>
                </div>
                {active ? (
                  <div aria-label="Selected" className="ml-2 shrink-0 text-[#2563eb]">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8.5" strokeWidth="1.6" />
                      <path d="M6.8 10.2l2.3 2.3 4.2-4.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  </div>
                ) : null}
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-center text-[12px] text-slate-400">No assignees found</li>
          ) : null}
        </ul>
      </section>
      <footer className="border-t border-slate-100 py-2 text-center">
        <button
          type="button"
          aria-label="Clear all assignees"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-700"
          onClick={() => commit([])}
        >
          <svg className="size-3" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 16 16">
            <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Clear assignees</span>
        </button>
      </footer>
    </DropdownPopover>
  )
}
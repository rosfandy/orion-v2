import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MdOutlineLabel } from 'react-icons/md'
import { Tag } from '#/components/ui/Tag'
import { DropdownPopover } from '#/features/workspaces/components/dropdown'
import { cn } from '#/lib/cn'
import { dedupeTagIds, toggleTagId } from './tagSerialization'
import { createWorkspaceTag, getWorkspaceTags } from './tagService'
import type { WorkspaceTag } from './tagService'

export const workspaceTagQueryKey = ['graph-tags'] as const
export const workspaceTagScopeQueryKey = (workspaceId: string) =>
  ['graph-tags', workspaceId] as const

export type TagDropdownProps = {
  workspaceId: string
  selectedTagIds?: string[]
  defaultValue?: string[]
  placeholder?: string
  onChange?: (tagIds: string[]) => void
  triggerClassName?: string
  contentClassName?: string
}

export function TagDropdown({
  workspaceId,
  selectedTagIds,
  defaultValue = [],
  placeholder = 'Tags',
  onChange,
  triggerClassName,
  contentClassName,
}: TagDropdownProps) {
  const queryClient = useQueryClient()
  const isControlled = selectedTagIds !== undefined
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue)
  const [query, setQuery] = useState('')
  const current = isControlled ? selectedTagIds : internalValue
  const trimmedQuery = query.trim()

  const tagsQuery = useQuery({
    queryKey: workspaceTagScopeQueryKey(workspaceId),
    queryFn: () => getWorkspaceTags(workspaceId),
    enabled: Boolean(workspaceId),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createWorkspaceTag(name, workspaceId),
    onSuccess: () =>
      queryClient.refetchQueries({
        queryKey: workspaceTagScopeQueryKey(workspaceId),
      }),
  })

  const tags = tagsQuery.data ?? []
  const selected = tags.filter((tag) => current.includes(tag.id))
  const filtered = trimmedQuery
    ? tags.filter((tag) =>
        tag.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : tags
  const showCreate =
    Boolean(trimmedQuery) &&
    !filtered.some(
      (tag) => tag.name.toLowerCase() === trimmedQuery.toLowerCase(),
    )

  function commit(next: string[]) {
    const deduped = dedupeTagIds(next)
    if (!isControlled) setInternalValue(deduped)
    onChange?.(deduped)
  }

  function toggle(tagId: string) {
    commit(toggleTagId(current, tagId))
  }

  async function handleCreate() {
    if (!trimmedQuery) return
    const existing = tags.find(
      (tag) => tag.name.toLowerCase() === trimmedQuery.toLowerCase(),
    )
    if (existing) {
      toggle(existing.id)
      setQuery('')
      return
    }
    await createMutation.mutateAsync(trimmedQuery)
    await queryClient.refetchQueries({
      queryKey: workspaceTagScopeQueryKey(workspaceId),
    })
    const fresh =
      queryClient.getQueryData<WorkspaceTag[]>(
        workspaceTagScopeQueryKey(workspaceId),
      ) ?? []
    const created = fresh.find(
      (tag) => tag.name.toLowerCase() === trimmedQuery.toLowerCase(),
    )
    commit(created ? [...current, created.id] : current)
    setQuery('')
  }

  return (
    <DropdownPopover
      ariaLabel="Set tags"
      triggerClassName={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        triggerClassName,
      )}
      contentClassName={cn(
        'w-[280px] overflow-hidden rounded-lg border border-slate-200/80 bg-white font-sans shadow-xl shadow-slate-300/40',
        contentClassName,
      )}
      trigger={
        selected.length > 0 ? (
          <span className="flex items-center gap-1">
            {selected.slice(0, 2).map((tag) => (
              <Tag
                key={tag.id}
                variant="neutral"
                className="max-w-28 truncate normal-case"
              >
                {tag.name}
              </Tag>
            ))}
            {selected.length > 2 ? (
              <span className="rounded-full bg-slate-200/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                +{selected.length - 2}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <MdOutlineLabel className="size-3 text-slate-400" />
            <span className="text-slate-400">{placeholder}</span>
          </span>
        )
      }
    >
      <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <MdOutlineLabel className="size-3.5 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tags or create..."
          autoComplete="off"
          className="w-full border-0 bg-transparent p-0 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </header>
      <section aria-label="Tags" className="py-2">
        <div className="px-3 pt-0.5 pb-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
            Tags
          </span>
        </div>
        <ul aria-label="Tags list" className="space-y-0.5" role="listbox">
          {filtered.map((tag) => {
            const active = current.includes(tag.id)
            return (
              <li
                key={tag.id}
                aria-selected={active}
                className="flex"
                role="option"
              >
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors',
                    active ? 'bg-slate-50/80 hover:bg-slate-100' : 'hover:bg-slate-50',
                  )}
                  onClick={() => toggle(tag.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Tag
                      variant="neutral"
                      className="max-w-44 truncate normal-case"
                    >
                      {tag.name}
                    </Tag>
                  </span>
                  {active ? (
                    <span
                      aria-label="Selected"
                      className="ml-2 shrink-0 text-[#2563eb]"
                    >
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <circle cx="10" cy="10" r="8.5" strokeWidth="1.6" />
                        <path
                          d="M6.8 10.2l2.3 2.3 4.2-4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
          {showCreate ? (
            <li className="flex" role="option">
              <button
                type="button"
                aria-label="Create tag"
                disabled={createMutation.isPending}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleCreate()}
              >
                <span className="text-[#2563eb]">
                  <svg
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="truncate text-[12.5px] font-medium text-slate-700">
                  Create "{trimmedQuery}"
                </span>
              </button>
            </li>
          ) : null}
          {!showCreate && filtered.length === 0 ? (
            <li className="px-3 py-2 text-center text-[12px] text-slate-400">
              {tagsQuery.isLoading ? 'Loading tags...' : 'No tags found'}
            </li>
          ) : null}
        </ul>
      </section>
      <footer className="border-t border-slate-100 py-2 text-center">
        <button
          type="button"
          aria-label="Clear all tags"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-700"
          onClick={() => commit([])}
        >
          <svg
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 16 16"
          >
            <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Clear tags</span>
        </button>
      </footer>
    </DropdownPopover>
  )
}
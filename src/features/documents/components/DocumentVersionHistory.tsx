import { useMemo } from 'react'
import type { ReactNode } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { MdDelete, MdTimer, MdAccessTime } from 'react-icons/md'
import { Button } from '#/components/ui/Button'
import { Loading } from '#/components/ui/Loading'
import {
  type DocumentVersion,
} from '#/features/documents/services/documentVersionService'
import { type UseDocumentVersionsReturn } from '#/features/documents/hooks/useDocumentVersions'
import { cn } from '#/lib/cn'
import { isHistoryFull, sortVersionsNewestFirst } from '#/features/documents/versionHistoryUtils'

dayjs.extend(relativeTime)

export type DocumentVersionHistoryProps = {
  hook: UseDocumentVersionsReturn
  graph_id: string
  /** Optional overlay shown when the create action cannot proceed. */
  blockReason?: ReactNode
  /** Called when a version item is clicked. Leave undefined to skip detail view. */
  onSelectVersion?: (version: DocumentVersion) => void
  className?: string
}

/**
 * Renders at most 10 version items newest first.
 *
 * Expects a pre-fetched `useDocumentVersions` hook instance so the Document
 * page retains control over fetching lifecycle (and autosave is unaffected).
 */
export function DocumentVersionHistory({
  hook,
  graph_id: _graph_id,
  blockReason,
  onSelectVersion,
  className,
}: DocumentVersionHistoryProps) {
  const { versions, isLoading, error, deleteVersion, isDeleting, isCreating } = hook

  const historyFull = isHistoryFull(error)
  const sorted = useMemo(
    () => sortVersionsNewestFirst(versions),
    [versions],
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Create action */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Version History
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={isCreating || !!blockReason || historyFull}
          onClick={() => { /* create action wired by caller via hook */ }}
          title={
            historyFull
              ? 'Cannot create: all history slots occupied by manual snapshots — delete one first.'
              : undefined
          }
        >
          {isCreating ? <Loading size="sm" /> : <MdAccessTime />}
          Snapshot
        </Button>
      </div>

      {/* Block reason overlay */}
      {historyFull && blockReason !== undefined ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {blockReason}
        </div>
      ) : null}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loading size="sm" /> Loading versions…
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No versions yet. Create your first manual snapshot to start tracking history.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-container-lowest">
          {sorted.map((v) => (
            <li
              key={v.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-primary-container/10',
                onSelectVersion ? 'cursor-pointer' : '',
              )}
              onClick={() => onSelectVersion?.(v)}
              role={onSelectVersion ? 'button' : undefined}
              tabIndex={onSelectVersion ? 0 : undefined}
              onKeyDown={
                onSelectVersion
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectVersion(v)
                    }
                  : undefined
              }
            >
              {/* Manual badge */}
              <span
                className={cn(
                  'shrink-0 text-xs font-medium px-1.5 py-0.5 rounded',
                  v.is_manual
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500',
                )}
                title={v.is_manual ? 'Manual snapshot' : 'Automatic snapshot'}
              >
                {v.is_manual ? 'M' : 'A'}
              </span>

              {/* Version number + date */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-on-surface">
                    v{v.version_number}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {dayjs(v.created_at).fromNow()}
                    <span className="ml-1 text-[10px] text-muted-foreground/70">
                      {dayjs(v.created_at).format('MMM D, YYYY HH:mm')}
                    </span>
                  </span>
                </div>
                {v.text_preview ? (
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {v.text_preview}
                  </p>
                ) : null}
              </div>

              {/* Delete button — manual only */}
              {v.is_manual ? (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={MdDelete}
                  aria-label={`Delete version ${v.version_number}`}
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation()
                    void deleteVersion(v.id)
                  }}
                  title="Delete manual snapshot"
                />
              ) : (
                <span
                  className="shrink-0 text-xs text-muted-foreground/50"
                  title="Automatic snapshots cannot be deleted"
                >
                  <MdTimer className="size-3.5" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

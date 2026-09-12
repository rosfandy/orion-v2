import type { WorkspaceMember } from '#/features/workspaces/services/workspaceService'
import { useState, useCallback } from 'react'
import { Avatar } from '#/components/ui/Avatar'
import { Button } from '#/components/ui/Button'
import { cn } from '#/lib/cn'
import { useCurrentUserId } from '#/features/auth/hooks/useCurrentUserId'
import { getInitials } from './utils'

export function MemberListTable({
  members,
  canManage,
  onRemove,
  isMutating,
}: {
  members: WorkspaceMember[]
  canManage: boolean
  onRemove?: (userId: string) => void
  isMutating?: boolean
}) {
  const currentUserId = useCurrentUserId()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user?.name ?? '',
    email: m.user?.email ?? '',
    role: m.role,
  }))

  const handleRemove = useCallback(
    async (userId: string) => {
      if (!onRemove) return
      setRemovingId(userId)
      try {
        await onRemove(userId)
        setError(null)
      } catch {
        setError('Failed to remove member. Please try again.')
      } finally {
        setRemovingId(null)
      }
    },
    [onRemove],
  )

  if (!rows.length && !isMutating) {
    return (
      <div className="rounded-lg border border-outline-variant p-6 text-center">
        <p className="text-body-sm text-on-surface-variant">No members yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-outline-variant">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="min-w-0 flex-1">Member</span>
        <span className="w-24 text-center">Role</span>
        {canManage ? <span className="w-16 text-right">Action</span> : null}
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isSelf = row.userId === currentUserId
        const isCreator = row.role === 'creator'
        // Remove action: only visible for non-self when manager=true
        const showRemove = canManage && !isSelf

        return (
          <div
            key={row.id}
            className={cn(
              'group flex items-center justify-between border-b border-outline-variant last:border-b-0 px-4 py-3 transition-colors hover:bg-surface-container-low',
            )}
          >
            {/* Name + email */}
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size="md" fallback={getInitials(row.name)} />
              <div className="min-w-0">
                <p className="truncate text-body-sm font-medium text-on-surface">
                  {row.name || row.email || row.userId}
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {row.email || row.userId}
                </p>
              </div>
            </div>

            {/* Role badge */}
            <span className="w-24 shrink-0 text-center">
              <RoleBadge role={row.role} isCreator={isCreator} />
            </span>

            {/* Action column */}
            <span className="w-16 shrink-0 text-right">
              {showRemove ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!removingId || !!isMutating}
                  loading={removingId === row.userId}
                  onClick={() => handleRemove(row.userId)}
                  aria-label={`Remove ${row.name ?? row.userId}`}
                >
                  Remove
                </Button>
              ) : isSelf ? (
                <span className="text-xs text-on-surface-variant opacity-50">You</span>
              ) : (
                <span className="text-xs text-on-surface-variant opacity-50">—</span>
              )}
            </span>
          </div>
        )
      })}

      {/* Error state */}
      {error ? (
        <div role="alert" className="rounded-lg bg-error/10 p-3 text-body-sm text-error">
          {error}
        </div>
      ) : null}
    </div>
  )
}

// ──────────────────────── Role Badge ────────────────────────

function RoleBadge({ role, isCreator }: { role: string; isCreator: boolean }) {
  if (isCreator) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary">
        Creator
      </span>
    )
  }

  switch (role) {
    case 'admin':
      return (
        <span className="inline-flex items-center rounded-full bg-warning-container px-2 py-0.5 text-xs font-semibold text-on-warning">
          Admin
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface-variant">
          Member
        </span>
      )
  }
}

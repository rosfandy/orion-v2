import type { SearchUser } from '#/features/workspaces/services/workspaceService'
import { Input } from '#/components/ui/Input'
import { Button } from '#/components/ui/Button'

export function MemberSearchResult({
  isOpen,
  query,
  onChange,
  foundUser,
  searchError,
  isSearching,
  onSelect,
  onDismiss,
  onClose,
}: {
  isOpen: boolean
  query: string
  onChange?: (value: string) => void
  foundUser: SearchUser | null
  searchError: string | null
  isSearching: boolean
  onSelect?: (user: SearchUser) => void
  onDismiss: () => void
  onClose: () => void
}) {
  // ── No-result state: show register message, no invite ──
  if (!isOpen && !foundUser && searchError) {
    return <NoResultState message={searchError} onDismiss={onDismiss} />
  }

  // ── Active search box ──
  if (isOpen) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
        <Input
          id="add-member-email"
          label="Email address"
          placeholder="name@example.com"
          value={query}
          onChange={(e) => onChange?.(e.target.value)}
          error={undefined}
          type="email"
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!query.trim() || isSearching} loading={isSearching}>
            Search
          </Button>
        </div>
      </div>
    )
  }

  // ── Found user: direct-add action ──
  if (foundUser) {
    return (
      <div className="rounded-lg border border-success bg-success/5 p-4">
        <p className="text-body-sm text-on-surface">
          Found{' '}
          <span className="font-semibold">{foundUser.name}</span>{' '}
          ({foundUser.email}).
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => foundUser && onSelect?.(foundUser)}
            disabled={isSearching}
            loading={isSearching}
          >
            Add member
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ── Default empty state inside open box ──
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
      <Input
        id="add-member-email"
        label="Email address"
        placeholder="name@example.com"
        value={query}
        onChange={(e) => onChange?.(e.target.value)}
        error={undefined}
        type="email"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!query.trim() || isSearching} loading={isSearching}>
          Search
        </Button>
      </div>
    </div>
  )
}

// ──────────────────────── No Result State ────────────────────────

function NoResultState({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div role="alert" className="rounded-lg border border-error bg-error/5 p-4">
      <p className="text-body-sm text-on-surface">{message}</p>
      <p className="mt-2 text-body-sm text-on-surface-variant">
        This user needs to register an account first before being added.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 rounded-lg border border-dashed border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
      >
        Dismiss
      </button>
    </div>
  )
}

import { useState, useCallback } from 'react'
import type { SearchUser } from '#/features/workspaces/services/workspaceService'
import { Input } from '#/components/ui/Input'
import { Button } from '#/components/ui/Button'
import { Modal } from '#/components/ui/Modal'
import { useWorkspaceMembers } from '#/features/workspaces/hooks/useWorkspaceMembers'
import { MemberListTable } from './MemberListTable'
import { MemberSearchResult } from './MemberSearchResult'

type Props = {
  workspaceId: string
  currentUserId?: string
}

export function MembersPage({ workspaceId, currentUserId }: Props) {
  // Modal state (replaces the old inline search box flow)
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [foundUser, setFoundUser] = useState<SearchUser | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const {
    members,
    isCreator,
    isLoading,
    error,
    addMember,
    removeMember,
    searchUserByEmail,
    searchIsPending,
    isMutating,
  } = useWorkspaceMembers({ workspaceId, currentUserId })

  // Open the add-member modal
  const handleOpenModal = useCallback(() => {
    setModalOpen(true)
    setQuery('')
    setFoundUser(null)
    setSearchError(null)
  }, [])

  // Close the add-member modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setQuery('')
    setFoundUser(null)
    setSearchError(null)
  }, [])

  // Handler: search by email
  const handleSearchEmail = useCallback(
    async (email: string) => {
      if (!email.trim()) return
      try {
        const user = await searchUserByEmail(email)
        setFoundUser(user)
        setSearchError(null)
      } catch {
        setFoundUser(null)
        setSearchError(
          'No account found with that email. This user needs to register an account first.',
        )
      }
    },
    [searchUserByEmail],
  )

  // Handler: click found user → direct add, no confirm, no role selector
  const handleSelectUser = useCallback(
    async (user: SearchUser) => {
      try {
        await addMember(user.email)
        handleCloseModal()
      } catch {
        setFoundUser(null)
        setSearchError('Failed to add member. Please try again.')
      }
    },
    [addMember, handleCloseModal],
  )

  // Handler: dismiss no-result state
  const handleDismiss = useCallback(() => {
    setFoundUser(null)
    setSearchError(null)
    setQuery('')
  }, [])

  return (
    <div className="p-6 pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-display-title mb-2 text-on-surface">Members</h1>
        <p className="mb-6 text-body-md text-on-surface-variant">
          Manage who has access to this workspace. Only the creator can add or
          remove members.
        </p>

        {/* ── Add member button ── */}
        {!isCreator ? (
          <p className="text-body-sm text-on-surface-variant">
            Read-only: only the workspace creator can manage members.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            + Add member
          </button>
        )}

        {error ? (
          <div role="alert" className="mt-4 rounded-lg bg-error/10 p-4 text-body-sm text-error">
            Failed to load members. Please try again.
          </div>
        ) : null}
        {isLoading && !members.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : null}
        <MemberListTable
          members={members}
          canManage={isCreator}
          onRemove={removeMember}
          isMutating={isMutating}
        />

        {/* ── Add-member modal ── */}
        <AddMemberModal
          open={modalOpen}
          onClose={handleCloseModal}
          query={query}
          onChange={(val) => {
            setQuery(val)
            setFoundUser(null)
            setSearchError(null)
          }}
          foundUser={foundUser}
          searchError={searchError}
          isSearching={searchIsPending}
          onSearch={handleSearchEmail}
          onSelect={handleSelectUser}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  )
}

// ──────────────────────── Add Member Modal ────────────────────────

type AddMemberModalProps = {
  open: boolean
  onClose: () => void
  query: string
  onChange: (value: string) => void
  foundUser: SearchUser | null
  searchError: string | null
  isSearching: boolean
  onSearch?: (email: string) => Promise<void>
  onSelect?: (user: SearchUser) => Promise<void>
  onDismiss?: () => void
}

function AddMemberModal({
  open,
  onClose,
  query,
  onChange,
  foundUser,
  searchError,
  isSearching,
  onSearch,
  onSelect,
  onDismiss,
}: AddMemberModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add member">
      {/* State A: just the email input */}
      {(!foundUser && !searchError) ? (
        <>
          <Input
            id="add-member-email"
            label="Email address"
            placeholder="name@example.com"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            error={undefined}
            type="email"
          />
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!query.trim() || isSearching}
              loading={isSearching}
              onClick={() => onSearch?.(query)}
            >
              Search
            </Button>
          </div>
        </>
      ) : /* State B: result shown (found or not-found) */ null ? (
        /* handled below */
        null
      ) : null}

      {/* State C: found user — tap to add directly */}
      {foundUser ? (
        <>
          <p className="mb-3 text-body-sm text-on-surface-variant">
            User found — click to add to workspace.
          </p>
          <button
            type="button"
            onClick={() => onSelect?.(foundUser)}
            className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary-container/10 p-3 transition-colors hover:bg-primary-container/20"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-label-md font-bold text-on-primary">
              {foundUser.name
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p.charAt(0).toUpperCase())
                .join('')}
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-body-sm font-semibold text-on-surface">
                {foundUser.name}
              </span>
              <span className="truncate text-body-sm text-on-surface-variant">
                {foundUser.email}
              </span>
            </span>
          </button>
        </>
      ) : /* State D: no account found */ searchError ? (
        <>
          <div role="alert" className="mb-4 rounded-lg bg-error/10 p-3 text-body-sm text-error">
            {searchError}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onDismiss}>
              Try another email
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  )
}

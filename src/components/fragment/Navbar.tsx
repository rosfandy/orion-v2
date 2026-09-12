import type { ReactNode } from 'react'
import {
  MdAdd,
  MdCheck,
  MdExpandMore,
  MdLogout,
  MdMenu,
  MdPerson,
} from 'react-icons/md'
import { Avatar } from '#/components/ui/Avatar'
import { Button } from '#/components/ui/Button'
import { Dropdown } from '#/components/ui/Dropdown'
import { Search } from '#/components/ui/Search'
import { useLogout } from '#/features/auth/hooks/useLogout'
import { cn } from '#/lib/cn'

export type NavbarProps = {
  workspaceName?: string
  userName?: string
  userEmail?: string
  avatarSrc?: string
  className?: string
  workspaceMenu?: ReactNode
  workspaces?: Workspace[]
  onWorkspaceSelect?: (id: string) => void
  onCreateWorkspace?: () => void
  onProfile?: () => void
  onLogout?: () => void
  onMenuClick?: () => void
}

export type Workspace = {
  id: string
  name: string
  description?: string
}

const defaultWorkspaces: Workspace[] = [
  { id: 'personal', name: 'Personal workspace', description: 'Bagus Rosfandy' },
  { id: 'product', name: 'Product team', description: '12 members' },
  { id: 'marketing', name: 'Marketing', description: '8 members' },
]

function MenuItem({
  icon: Icon,
  children,
  onClick,
}: {
  icon: typeof MdPerson
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Button
      type="button"
      role="menuitem"
      variant="ghost"
      size="sm"
      icon={Icon}
      className="h-auto w-full justify-start rounded-md px-3 py-2 text-left text-xs font-normal text-on-surface hover:bg-surface-container"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function WorkspaceList({
  workspaces,
  activeWorkspace,
  onSelect,
  onCreate,
}: {
  workspaces: Workspace[]
  activeWorkspace: string
  onSelect?: (id: string) => void
  onCreate?: () => void
}) {
  return (
    <div className="flex max-h-80 w-72 flex-col">
      <div className="overflow-y-auto p-1">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Workspaces
        </p>
        {workspaces.map((workspace) => (
          <Button
            key={workspace.id}
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            className="h-auto w-full justify-start rounded-md px-3 py-2.5 text-left font-normal hover:bg-surface-container"
            onClick={() => onSelect?.(workspace.id)}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-container text-xs font-semibold text-on-primary">
              {workspace.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-on-surface">
                {workspace.name}
              </span>
              {workspace.description ? (
                <span className="block truncate text-xs text-on-surface-variant">
                  {workspace.description}
                </span>
              ) : null}
            </span>
            {workspace.id === activeWorkspace ? (
              <MdCheck className="size-4 text-primary" />
            ) : null}
          </Button>
        ))}
      </div>
      <div className="mt-auto border-t border-slate-100 bg-surface-container-lowest p-2">
        <Button
          icon={MdAdd}
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={onCreate}
        >
          Create workspace
        </Button>
      </div>
    </div>
  )
}

export function Navbar({
  workspaceName = 'My Workspace',
  userName = 'Anonymous',
  userEmail,
  avatarSrc,
  className,
  workspaceMenu,
  workspaces = defaultWorkspaces,
  onWorkspaceSelect,
  onCreateWorkspace,
  onProfile,
  onLogout,
  onMenuClick,
}: NavbarProps) {
  const { logout } = useLogout()
  const activeWorkspace =
    workspaces.find((workspace) => workspace.name === workspaceName)?.id ?? ''

  return (
    <header
      className={cn(
        'flex h-12 w-full items-center gap-2 border-b border-slate-100 bg-surface-container-lowest px-3 md:px-4',
        className,
      )}
    >
      <Button
        icon={MdMenu}
        iconOnly
        variant="ghost"
        size="sm"
        aria-label="Open navigation"
        className="xl:hidden"
        onClick={onMenuClick}
      />
      <div className="min-w-0 flex-1">
        <Dropdown
          trigger={
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{workspaceName}</span>
              <MdExpandMore className="size-5 shrink-0 text-on-surface-variant" />
            </span>
          }
          buttonProps={{
            variant: 'ghost',
            size: 'sm',
            className: 'max-w-full justify-start px-2 text-xs text-on-surface',
          }}
          contentClassName="left-0 right-auto overflow-hidden p-0"
        >
          {workspaceMenu ?? (
            <WorkspaceList
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelect={onWorkspaceSelect}
              onCreate={onCreateWorkspace}
            />
          )}
        </Dropdown>
      </div>

      <div className="block min-w-0 flex-1 max-w-[280px]">
        <Search className="block w-full" buttonProps={{ size: 'sm' }} />
      </div>

      <div className="flex flex-1 justify-end">
        <Dropdown
          trigger={
            <span className="flex items-center gap-2">
              <Avatar
                src={avatarSrc}
                alt={userName}
                fallback={userName.slice(0, 2).toUpperCase()}
                size="sm"
                className="text-xs"
              />
              <MdExpandMore className="size-5 text-on-surface-variant" />
            </span>
          }
          buttonProps={{
            variant: 'ghost',
            size: 'sm',
            className: 'px-2 text-xs',
          }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
            <Avatar
              src={avatarSrc}
              alt={userName}
              fallback={userName.slice(0, 2).toUpperCase()}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">
                {userName}
              </p>
              <p className="truncate text-xs text-on-surface-variant">
                {userEmail ?? 'Email unavailable'}
              </p>
            </div>
          </div>
          <MenuItem icon={MdPerson} onClick={onProfile}>
            Profile
          </MenuItem>
          <MenuItem
            icon={MdLogout}
            onClick={() => {
              onLogout?.()
              logout()
            }}
          >
            Logout
          </MenuItem>
        </Dropdown>
      </div>
    </header>
  )
}

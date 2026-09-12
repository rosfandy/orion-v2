import type { ReactNode } from 'react'
import { MdExpandMore, MdLogout, MdPerson } from 'react-icons/md'
import { Avatar } from '#/components/ui/Avatar'
import { Button } from '#/components/ui/Button'
import { Dropdown } from '#/components/ui/Dropdown'
import { Search } from '#/components/ui/Search'
import { useLogout } from '#/features/auth/hooks/useLogout'
import { cn } from '#/lib/cn'
import { Link } from 'react-router-dom'

export type NavbarProps = {
  workspaceId?: string
  onMenuClick?: () => void
  userName?: string
  userEmail?: string
  avatarSrc?: string
  className?: string
  onProfile?: () => void
  onLogout?: () => void
}

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

export function Navbar({
  userName = 'Anonymous',
  userEmail,
  avatarSrc,
  className,
  onProfile,
  onLogout,
}: NavbarProps) {
  const { logout } = useLogout()

  return (
    <header
      className={cn(
        'flex h-12 w-full items-center gap-2 border-b border-slate-100 bg-surface-container-lowest px-3 md:px-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Link
          to="/"
          className="block truncate text-xs font-semibold text-on-surface hover:text-primary"
        >
          My Workspace
        </Link>
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

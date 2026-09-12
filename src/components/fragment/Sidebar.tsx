import { useEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { gsap } from 'gsap'
import {
  MdAdd,
  MdChevronRight,
  MdDeleteOutline,
  MdDescription,
  MdEdit,
  MdFolder,
  MdFormatListBulleted,
  MdKeyboardDoubleArrowLeft,
  MdMoreVert,
} from 'react-icons/md'
import { Button } from '#/components/ui/Button'
import { Dropdown } from '#/components/ui/Dropdown'
import { cn } from '#/lib/cn'

type SidebarIcon = ComponentType<{ className?: string }>

export type SidebarItem = {
  key: string
  label?: ReactNode
  icon?: SidebarIcon
  children?: SidebarItem[]
  type?: 'group' | 'space' | 'folder' | 'list' | 'document'
  badge?: ReactNode
  detail?: ReactNode
  disabled?: boolean
  action?: boolean
  actions?: boolean
  actionType?: 'group' | 'space' | 'folder'
  expandable?: boolean
}

export type SidebarProps = {
  items: SidebarItem[]
  title?: ReactNode
  activeItem?: string
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  openKeys?: string[]
  defaultOpenKeys?: string[]
  collapsed?: boolean
  collapsible?: boolean
  className?: string
  workspaceId?: string
  onSelect?: (key: string, item: SidebarItem) => void
  onAdd?: (item: SidebarItem, relation?: string, label?: string) => void
  onEdit?: (item: SidebarItem) => void
  onDelete?: (item: SidebarItem) => void
  onOpenChange?: (openKeys: string[]) => void
  onCollapse?: (collapsed: boolean) => void
  mobileOpen?: boolean
  mobileMounted?: boolean
}

function MenuItem({
  item,
  selectedKeys,
  openKeys,
  workspaceId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: SidebarItem
  selectedKeys: string[]
  openKeys: string[]
  workspaceId?: string
  onSelect: (item: SidebarItem) => void
  onAdd?: (item: SidebarItem, relation?: string, label?: string) => void
  onEdit?: (item: SidebarItem) => void
  onDelete?: (item: SidebarItem) => void
  onToggle: (key: string) => void
}) {
  const router = useRouter({ warn: false })
  const selected = selectedKeys.includes(item.key)
  const hasChildren = Boolean(item.children?.length)
  const expandable = hasChildren || item.expandable === true
  const isOpen = openKeys.includes(item.key)
  const childrenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasChildren || !childrenRef.current) return

    const animation = gsap.to(childrenRef.current, {
      height: isOpen ? 'auto' : 0,
      opacity: isOpen ? 1 : 0,
      duration: 0.25,
      ease: 'power2.out',
    })

    return () => {
      animation.kill()
    }
  }, [hasChildren, isOpen])

  if (item.type === 'group') {
    return (
      <div>
        <div className="flex items-center justify-between px-4 pb-2 pt-4 group-data-[collapsed=true]/sidebar:hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {item.label}
          </h2>
          {item.action ? <ActionMenu item={item} onAdd={onAdd} /> : null}
        </div>
        {item.children?.map((child) => (
          <MenuItem
            key={child.key}
            item={child}
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            workspaceId={workspaceId}
            onSelect={onSelect}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    )
  }

  const Icon = item.icon
  return (
    <div>
      <div className="group/navitem relative">
        {expandable ? (
          <button
            type="button"
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${String(item.label ?? 'navigation')}`}
            aria-expanded={isOpen}
            className={cn(
              'absolute top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 transition-colors hover:bg-surface-container-low hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-data-[collapsed=true]/sidebar:hidden',
              'left-2',
            )}
            onClick={() => onToggle(item.key)}
          >
            <MdChevronRight
              className={cn(
                'size-4 transition-transform',
                isOpen && 'rotate-90',
              )}
            />
          </button>
        ) : null}
        <Button
          type="button"
          disabled={item.disabled}
          aria-current={selected ? 'page' : undefined}
          icon={Icon}
          variant="ghost"
          size="sm"
          className={cn(
            'group relative mx-2 mb-1 flex w-[calc(100%-1rem)] justify-start rounded-lg text-left font-normal text-gray-500 hover:bg-surface-container-low group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-2',
            selected && 'bg-surface-container font-semibold text-primary',
            expandable ? 'pl-8' : undefined,
            item.action ? 'pr-10' : undefined,
          )}
          onClick={() => {
            if (item.type === 'list' && workspaceId) {
              void router.navigate({
                to: '/workspace/$id/s/l/$listid',
                params: { id: workspaceId, listid: item.key },
              })
              return
            }
            if (item.key === 'members' && workspaceId) {
              void router.navigate({
                to: '/workspace/$id/m',
                params: { id: workspaceId },
              })
              return
            }
            onSelect(item)
            if (expandable && !isOpen) onToggle(item.key)
          }}
        >
          <span className="min-w-0 flex-1 truncate group-data-[collapsed=true]/sidebar:hidden">
            {item.label}
          </span>
          {item.detail ? (
            <span className="ml-1 truncate text-xs text-gray-400 group-data-[collapsed=true]/sidebar:hidden">
              {item.detail}
            </span>
          ) : null}
          {item.badge ? (
            <span className="ml-auto pl-3 text-xs text-gray-400 group-data-[collapsed=true]/sidebar:hidden">
              {item.badge}
            </span>
          ) : null}
        </Button>
        {item.action || item.actions ? (
          <ActionMenu
            item={item}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            className="absolute right-2 top-1/2 z-50 -translate-y-1/2 opacity-0 transition-opacity group-hover/navitem:opacity-100 group-data-[collapsed=true]/sidebar:hidden"
          />
        ) : null}
      </div>
      {hasChildren ? (
        <div
          ref={childrenRef}
          className={cn(
            'relative pl-4 before:pointer-events-none before:absolute before:bottom-1 before:left-5 before:top-0 before:z-10 before:w-px before:bg-gray-300 group-data-[collapsed=true]/sidebar:pl-0',
            isOpen ? 'overflow-visible' : 'overflow-hidden',
          )}
        >
          {item.children?.map((child) => (
            <MenuItem
              key={child.key}
              item={child}
              selectedKeys={selectedKeys}
              openKeys={openKeys}
              workspaceId={workspaceId}
              onSelect={onSelect}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const actionOptions = {
  group: [{ relation: 'HAS_SPACES', label: 'Space', icon: MdFolder }],
  space: [
    { relation: 'HAS_FOLDERS', label: 'Folder', icon: MdFolder },
    { relation: 'HAS_LISTS', label: 'List', icon: MdFormatListBulleted },
    { relation: 'HAS_DOCUMENTS', label: 'Document', icon: MdDescription },
  ],
  folder: [
    { relation: 'HAS_LISTS', label: 'List', icon: MdFormatListBulleted },
    { relation: 'HAS_DOCUMENTS', label: 'Document', icon: MdDescription },
  ],
} as const

function ActionMenu({
  item,
  onAdd,
  onEdit,
  onDelete,
  className,
}: {
  item: SidebarItem
  onAdd?: (item: SidebarItem, relation: string, label: string) => void
  onEdit?: (item: SidebarItem) => void
  onDelete?: (item: SidebarItem) => void
  className?: string
}) {
  const options = actionOptions[item.actionType ?? 'folder']
  const [openMenu, setOpenMenu] = useState<'add' | 'actions'>()
  const hoverOnly = Boolean(className)

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        className,
        hoverOnly
          ? openMenu
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none group-hover/navitem:pointer-events-auto'
          : 'pointer-events-auto',
      )}
    >
      {item.action ? (
        <Dropdown
          open={openMenu === 'add'}
          onOpenChange={(open) => setOpenMenu(open ? 'add' : undefined)}
          trigger={<MdAdd className="size-4" />}
          buttonProps={{
            variant: 'ghost',
            size: 'sm',
            'aria-label': `Add to ${String(item.label ?? 'navigation')}`,
            className: 'size-6 p-0 text-gray-400 hover:text-primary',
          }}
          contentClassName="right-0 min-w-36"
        >
          {options.map((option) => (
            <Button
              key={option.relation}
              variant="ghost"
              size="sm"
              role="menuitem"
              icon={option.icon}
              className="w-full justify-start rounded-md text-xs font-normal text-on-surface"
              onClick={() => onAdd?.(item, option.relation, option.label)}
            >
              {option.label}
            </Button>
          ))}
        </Dropdown>
      ) : null}
      {item.type !== 'group' ? (
        <Dropdown
          open={openMenu === 'actions'}
          onOpenChange={(open) => setOpenMenu(open ? 'actions' : undefined)}
          trigger={<MdMoreVert className="size-4" />}
          buttonProps={{
            variant: 'ghost',
            size: 'sm',
            'aria-label': `Actions for ${String(item.label ?? 'navigation')}`,
            className: 'size-6 p-0 text-gray-400 hover:text-primary',
          }}
          contentClassName="right-0 min-w-36"
        >
          <Button
            icon={MdEdit}
            variant="ghost"
            size="sm"
            role="menuitem"
            className="w-full justify-start rounded-md text-xs font-normal text-on-surface"
            onClick={() => onEdit?.(item)}
          >
            Edit
          </Button>
          <Button
            icon={MdDeleteOutline}
            variant="ghost"
            size="sm"
            role="menuitem"
            className="w-full justify-start rounded-md text-xs font-normal text-error hover:text-error"
            onClick={() => onDelete?.(item)}
          >
            Delete
          </Button>
        </Dropdown>
      ) : null}
    </div>
  )
}

export function Sidebar({
  items,
  title = 'Orion',
  activeItem,
  selectedKeys,
  defaultSelectedKeys,
  openKeys: controlledOpenKeys,
  defaultOpenKeys,
  collapsed: controlledCollapsed,
  collapsible = true,
  className,
  workspaceId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onOpenChange,
  onCollapse,
  mobileOpen = false,
  mobileMounted = false,
}: SidebarProps) {
  const [internalSelectedKeys, setInternalSelectedKeys] = useState(
    defaultSelectedKeys ?? [activeItem ?? 'project-1'],
  )
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [internalOpenKeys, setInternalOpenKeys] = useState(
    defaultOpenKeys ?? [],
  )
  const sidebarRef = useRef<HTMLElement>(null)
  const isCollapsed = controlledCollapsed ?? internalCollapsed
  const selected = selectedKeys ?? internalSelectedKeys
  const openKeys = controlledOpenKeys ?? internalOpenKeys

  useEffect(() => {
    if (!sidebarRef.current) return
    const animation = gsap.to(sidebarRef.current, {
      width: isCollapsed ? 64 : 256,
      duration: 0.3,
      ease: 'power2.out',
    })
    return () => {
      animation.kill()
    }
  }, [isCollapsed])

  useEffect(() => {
    if (!mobileMounted || !sidebarRef.current) return

    const animation = mobileOpen
      ? gsap.fromTo(
          sidebarRef.current,
          { xPercent: -100 },
          { xPercent: 0, duration: 0.3, ease: 'power2.out' },
        )
      : gsap.to(sidebarRef.current, {
          xPercent: -100,
          duration: 0.3,
          ease: 'power2.in',
        })
    const navItems = sidebarRef.current.querySelectorAll('nav > div')
    const itemAnimation = mobileOpen
      ? gsap.fromTo(
          navItems,
          { opacity: 0, x: -12 },
          {
            opacity: 1,
            x: 0,
            duration: 0.2,
            stagger: 0.04,
            delay: 0.1,
            ease: 'power2.out',
          },
        )
      : gsap.to(navItems, { opacity: 0, duration: 0.15, ease: 'power2.in' })

    return () => {
      animation.kill()
      itemAnimation.kill()
    }
  }, [mobileMounted, mobileOpen])

  function handleSelect(item: SidebarItem) {
    if (item.disabled) return
    if (selectedKeys === undefined) setInternalSelectedKeys([item.key])
    onSelect?.(item.key, item)
  }

  function handleToggle(key: string) {
    const nextOpenKeys = openKeys.includes(key)
      ? openKeys.filter((openKey) => openKey !== key)
      : [...openKeys, key]
    if (controlledOpenKeys === undefined) setInternalOpenKeys(nextOpenKeys)
    onOpenChange?.(nextOpenKeys)
  }

  function handleCollapse() {
    const nextCollapsed = !isCollapsed
    if (controlledCollapsed === undefined) setInternalCollapsed(nextCollapsed)
    onCollapse?.(nextCollapsed)
  }

  return (
    <aside
      ref={sidebarRef}
      data-collapsed={isCollapsed}
      className={cn(
        'group/sidebar flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200/50 bg-white font-hanken',
        className,
      )}
    >
      {collapsible ? (
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white p-3">
          <span className="text-label-lg font-semibold text-black group-data-[collapsed=true]/sidebar:hidden">
            {title}
          </span>
          <Button
            icon={MdKeyboardDoubleArrowLeft}
            iconOnly
            variant="ghost"
            size="sm"
            aria-label="Collapse sidebar"
            onClick={handleCollapse}
          />
        </header>
      ) : null}
      <nav className="flex-1 pb-5" aria-label="Workspace navigation">
        {items.map((item) => (
          <MenuItem
            key={item.key}
            item={item}
            selectedKeys={selected}
            openKeys={openKeys}
            workspaceId={workspaceId}
            onSelect={handleSelect}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={handleToggle}
          />
        ))}
      </nav>
    </aside>
  )
}

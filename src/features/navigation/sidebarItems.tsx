import {
  MdAutoAwesome,
  MdChecklist,
  MdDescription,
  MdFolder,
  MdFormatListBulleted,
  MdPeople,
} from 'react-icons/md'
import type { SidebarItem } from '#/components/fragment/Sidebar'
import { Avatar } from '#/components/ui/Avatar'
import type {
  GraphRelation,
  GraphNode,
  GraphRelations,
  GraphSpace,
} from '#/features/graphs/services/graphService'

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function createSpaceAvatar(name: string): SidebarItem['icon'] {
  const initials = getInitials(name)

  return function SpaceAvatar({ className }: { className?: string }) {
    return <Avatar size="sm" fallback={initials} className={className} />
  }
}

const membersItem: SidebarItem = {
  key: 'members',
  label: 'Members',
  icon: MdPeople,
}

const generalItems: SidebarItem = {
  key: 'general',
  label: 'General',
  type: 'group',
  children: [
    { key: 'all-tasks', label: 'All Tasks', icon: MdChecklist },
    {
      key: 'super-agents',
      label: 'Super Agents',
      icon: MdAutoAwesome,
      children: [
        {
          key: 'meeting-agent',
          label: '1:1 Meeting Agent',
          icon: MdAutoAwesome,
        },
        { key: 'ceo-digest', label: 'CEO Digest', icon: MdAutoAwesome },
      ],
    },
  ],
}

function toChildren(relations: GraphRelations): SidebarItem[] {
  return [
    ...(relations.HAS_FOLDERS ?? []).map((relation) =>
      toItem(relation, MdFolder, 'folder'),
    ),
    ...(relations.HAS_LISTS ?? []).map((relation) =>
      toItem(relation, MdFormatListBulleted, 'list'),
    ),
    ...(relations.HAS_DOCUMENTS ?? []).map((relation) =>
      toItem(relation, MdDescription, 'document'),
    ),
  ]
}

function toItem(
  relation: GraphRelation,
  icon: SidebarItem['icon'],
  itemType: 'folder' | 'list' | 'document',
): SidebarItem {
  const children = toChildren(relation)
  const isFolder = itemType === 'folder'

  return {
    key: relation.data.id,
    label: relation.data.name,
    icon,
    actions: true,
    type: itemType,
    ...(isFolder
      ? { action: true, actionType: 'folder' as const, expandable: true }
      : {}),
    ...(children.length ? { children } : {}),
  }
}

export function createSidebarItems(
  spaces: GraphSpace[] = [],
  refreshedNodes: Record<string, GraphNode> = {},
): SidebarItem[] {
  const spaceItems: SidebarItem[] = spaces.map((space) => {
    const node = refreshedNodes[space.meta.id] ?? space
    const children = toChildren(node)

    return {
      key: space.meta.id,
      label: space.meta.name,
      icon: createSpaceAvatar(space.meta.name),
      type: 'space',
      action: true,
      actionType: 'space' as const,
      expandable: true,
      ...(children.length ? { children } : {}),
    }
  })

  return [
    membersItem,
    {
      key: 'space',
      label: 'Space',
      type: 'group',
      action: true,
      actionType: 'group',
      children: spaceItems,
    },
  ]
}

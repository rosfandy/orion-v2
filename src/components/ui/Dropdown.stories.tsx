import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Avatar } from './Avatar'
import { Dropdown } from './Dropdown'

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

const menuContent = (
  <>
    <button
      type="button"
      role="menuitem"
      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-container"
    >
      Account settings
    </button>
    <button
      type="button"
      role="menuitem"
      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-container"
    >
      Sign out
    </button>
  </>
)

export const WorkspaceMenu: Story = {
  args: {
    trigger: (
      <span className="flex items-center gap-2">
        <Avatar alt="Bagus Rosfandy" fallback="BR" className="size-7 text-xs" />
        <span>Bagus Rosfandy</span>
      </span>
    ),
    children: menuContent,
    buttonProps: { variant: 'secondary', className: 'h-12 px-3' },
  },
}

export const Open: Story = {
  args: {
    trigger: 'Open menu',
    children: menuContent,
    defaultOpen: true,
  },
}

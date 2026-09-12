import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Search } from './Search'

const meta = {
  title: 'UI/Search',
  component: Search,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Search>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <p className="text-sm text-on-surface-variant">
        Type a query to search your workspace.
      </p>
    ),
  },
}

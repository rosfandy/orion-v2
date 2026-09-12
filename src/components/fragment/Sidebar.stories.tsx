import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import { MdDashboard, MdFolder, MdSettings } from 'react-icons/md'
import { Sidebar } from './Sidebar'

const meta = {
  title: 'Fragment/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { items: [] },
  render: () => {
    const [activeItem, setActiveItem] = useState('project-1')
    return (
      <Sidebar
        items={[]}
        selectedKeys={[activeItem]}
        onSelect={(key) => setActiveItem(key)}
      />
    )
  },
}

export const NestedItems: Story = {
  args: {
    defaultSelectedKeys: ['overview'],
    items: [
      { key: 'overview', label: 'Overview', icon: MdDashboard },
      {
        key: 'projects',
        label: 'Projects',
        icon: MdFolder,
        children: [
          { key: 'website', label: 'Website redesign', icon: MdFolder },
          {
            key: 'mobile',
            label: 'Mobile app',
            icon: MdFolder,
            children: [
              { key: 'settings', label: 'Settings', icon: MdSettings },
            ],
          },
        ],
      },
    ],
  },
}

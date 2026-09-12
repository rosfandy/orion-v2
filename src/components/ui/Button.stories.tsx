import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { MdSettings } from 'react-icons/md'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { children: 'Log In' } }
export const Secondary: Story = {
  args: { children: 'Cancel', variant: 'secondary' },
}
export const Ghost: Story = {
  args: { children: 'Forgot password?', variant: 'ghost' },
}
export const Disabled: Story = { args: { children: 'Log In', disabled: true } }
export const WithIcon: Story = {
  args: { icon: MdSettings, children: 'Settings' },
}
export const IconOnly: Story = {
  args: { icon: MdSettings, iconOnly: true, 'aria-label': 'Settings' },
}

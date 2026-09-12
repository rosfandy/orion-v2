import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { id: 'email', label: 'Email address', placeholder: 'you@example.com' },
}

export const Error: Story = {
  args: {
    id: 'email-error',
    label: 'Email address',
    value: 'invalid-email',
    error: 'Email required',
    readOnly: true,
  },
}

export const Disabled: Story = {
  args: {
    id: 'username-disabled',
    label: 'Username (Disabled)',
    value: 'system_user_99',
    disabled: true,
  },
}

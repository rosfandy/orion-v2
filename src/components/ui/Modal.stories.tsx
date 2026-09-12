import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { open: true, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Workspace details"
        >
          <p className="text-body-md text-on-surface-variant">
            This modal is animated with GSAP.
          </p>
        </Modal>
      </>
    )
  },
}

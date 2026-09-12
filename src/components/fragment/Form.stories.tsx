import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Button } from '#/components/ui/Button'
import { Input } from '#/components/ui/Input'
import { Form } from './Form'

const meta = {
  title: 'Fragment/Form',
  component: Form,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

export const WithFormItem: Story = {
  render: () => (
    <Form
      className="w-80"
      initialValues={{ email: '' }}
      validateTrigger={['submit', 'blur']}
      onFinishFailed={({ errorFields }) => console.log(errorFields)}
    >
      <Form.Item
        name="email"
        label="Email address"
        rules={[{ required: true, message: 'Email is required.' }, { type: 'email' }]}
      >
        <Input placeholder="you@example.com" />
      </Form.Item>
      <Button type="submit" className="w-full">Continue</Button>
    </Form>
  ),
}

export const MultipleFormItems: Story = {
  render: () => (
    <Form className="w-80">
      <Form.Item name="email" label="Email" rules={[{ required: true }]}>
        <Input type="email" placeholder="you@example.com" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input type="password" placeholder="Password" />
      </Form.Item>
      <Button type="submit" className="w-full">Sign in</Button>
    </Form>
  ),
}

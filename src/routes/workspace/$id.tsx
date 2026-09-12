import { useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { AppLayout } from '#/components/layout/AppLayout'
import { Form } from '#/components/fragment/Form'
import type { SidebarItem } from '#/components/fragment/Sidebar'
import { Button } from '#/components/ui/Button'
import { Input } from '#/components/ui/Input'
import { Modal } from '#/components/ui/Modal'
import { createSidebarItems } from '#/features/navigation/sidebarItems'
import { useGraph, useGraphById } from '#/features/graphs/hooks/useGraph'

export default function Workspace() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: graph, update, remove, isUpdating } = useGraph(id)
  const [activeItem, setActiveItem] = useState('all-tasks')
  const [selectedGraphId, setSelectedGraphId] = useState<string>()
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false)
  const [renameItem, setRenameItem] = useState<SidebarItem>()
  const [createTarget, setCreateTarget] = useState({
    id,
    relation: 'HAS_SPACES',
    label: 'Space',
  })
  const { data: selectedGraph, refetch: refreshSelectedGraph } =
    useGraphById(selectedGraphId)
  const refreshedNodes = selectedGraph
    ? { [selectedGraph.meta.id]: selectedGraph }
    : {}
  const location = useLocation()
  const listId = location.pathname.match(/\/s\/l\/([^/]+)/)?.[1]

  return (
    <AppLayout
      sidebarItems={createSidebarItems(graph, refreshedNodes)}
      activeItem={listId ?? activeItem}
      workspaceId={id}
      onSidebarSelect={(key, item) => {
        setActiveItem(key)
        if (item.actionType === 'space' || item.actionType === 'folder') {
          if (selectedGraphId === item.key) {
            void refreshSelectedGraph()
          }
          setSelectedGraphId(item.key)
        }
      }}
      onSidebarAdd={(item, relation, label) => {
        if (!relation || !label) return
        setCreateTarget({
          id: item.key === 'space' ? id : item.key,
          relation,
          label,
        })
        setCreateSpaceOpen(true)
      }}
      onSidebarEdit={(item) => setRenameItem(item)}
      onSidebarDelete={async (item) => {
        if (!window.confirm(`Delete ${String(item.label ?? 'this graph')}?`))
          return
        await remove(item.key)
        if (activeItem === item.key) setActiveItem('all-tasks')
        if (selectedGraphId === item.key) setSelectedGraphId(undefined)
      }}
    >
      <Outlet />
      <Modal
        open={createSpaceOpen}
        onClose={() => setCreateSpaceOpen(false)}
        title={`Create ${createTarget.label.toLowerCase()}`}
      >
        <Form
          onFinish={async (values) => {
            await update({
              graphId: createTarget.id,
              name: String(values.name ?? ''),
              relation: createTarget.relation,
              label: createTarget.label,
              ...(createTarget.label === 'Space'
                ? { props: { workspaceId: id } }
                : {}),
            })
            setCreateSpaceOpen(false)
          }}
        >
          <Form.Item
            name="name"
            label={`${createTarget.label} name`}
            rules={[
              {
                required: true,
                message: `${createTarget.label} name required`,
              },
            ]}
          >
            <Input placeholder={`${createTarget.label} name`} />
          </Form.Item>
          <Button type="submit" loading={isUpdating} className="mt-4 w-full">
            Create {createTarget.label.toLowerCase()}
          </Button>
        </Form>
      </Modal>
      <Modal
        open={Boolean(renameItem)}
        onClose={() => setRenameItem(undefined)}
        title={`Edit ${String(renameItem?.label ?? 'graph')}`}
      >
        {renameItem ? (
          <Form
            initialValues={{ name: renameItem.label }}
            onFinish={async (values) => {
              await update({
                graphId: renameItem.key,
                name: String(values.name ?? '').trim(),
              })
              setRenameItem(undefined)
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Graph name required' }]}
            >
              <Input placeholder="Graph name" />
            </Form.Item>
            <Button type="submit" loading={isUpdating} className="mt-4 w-full">
              Save changes
            </Button>
          </Form>
        ) : null}
      </Modal>
    </AppLayout>
  )
}

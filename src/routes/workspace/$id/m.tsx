import { createFileRoute } from '@tanstack/react-router'
import { useCurrentUserId } from '#/features/auth/hooks/useCurrentUserId'
import { MembersPage } from '#/features/workspaces/components/members/MembersPage'

export const Route = createFileRoute('/workspace/$id/m')({
  component: MembersRoute,
})

function MembersRoute() {
  const { id } = Route.useParams()
  const currentUserId = useCurrentUserId()

  return <MembersPage workspaceId={id} currentUserId={currentUserId} />
}

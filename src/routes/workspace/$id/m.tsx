import { useParams } from 'react-router-dom'
import { useCurrentUserId } from '#/features/auth/hooks/useCurrentUserId'
import { MembersPage } from '#/features/workspaces/components/members/MembersPage'

export default function MembersRoute() {
  const { id = '' } = useParams<{ id: string }>()
  const currentUserId = useCurrentUserId()

  return <MembersPage workspaceId={id} currentUserId={currentUserId} />
}

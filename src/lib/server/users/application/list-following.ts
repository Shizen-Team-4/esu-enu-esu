import type { Viewer } from '../../shared/domain/viewer'
import { resolveFollowList, type ListFollowsInput } from './resolve-follow-list'
import type { UserRepository } from './ports'

export const listFollowing =
	(users: UserRepository) => async (viewer: Viewer | null, input: ListFollowsInput) => {
		const { page, ownerId, viewerId } = await resolveFollowList(users, viewer, input)
		return users.listFollowing(ownerId, viewerId, page)
	}

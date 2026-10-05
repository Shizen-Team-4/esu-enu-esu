import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from '../../shared/domain/page-query'
import type { UserRepository } from './ports'

export type ListFollowsInput = { username: string; cursor?: string; limit?: unknown }

/** Shared lookup for the two follow lists: validate paging, resolve the profile owner. */
export async function resolveFollowList(
	users: UserRepository,
	viewer: Viewer | null,
	input: ListFollowsInput,
) {
	const page = pageQuery(input)
	const owner = await users.find({ username: input.username }, viewer?.id ?? null)
	if (!owner?.username) throw new AppError('NOT_FOUND')
	return { page, ownerId: owner.id, viewerId: viewer?.id ?? null }
}

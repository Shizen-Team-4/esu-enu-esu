import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { decodeCursor, parseLimit } from '../../shared/domain/cursor'
import type { PostRepository } from './ports'

export const listPosts =
	(posts: PostRepository) =>
	async (
		viewer: Viewer | null,
		input: {
			scope?: string
			cursor?: string
			limit?: unknown
			type?: 'reel'
			authorId?: string
		} = {},
	) => {
		const scope = input.scope ?? 'all'
		if (scope !== 'all' && scope !== 'following' && scope !== 'saved')
			throw new AppError('VALIDATION_FAILED', { scope: 'INVALID_FORMAT' })
		if (scope !== 'all' && !viewer) throw new AppError('UNAUTHENTICATED')
		return posts.list({
			viewerId: viewer?.id ?? null,
			scope,
			cursor: input.cursor ? decodeCursor(input.cursor) : undefined,
			limit: parseLimit(input.limit),
			type: input.type,
			authorId: input.authorId,
		})
	}

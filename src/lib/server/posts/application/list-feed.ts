import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from './page-query'
import type { PostRepository } from './ports'

export const listFeed =
	(posts: PostRepository) =>
	async (
		viewer: Viewer | null,
		input: { scope?: string; cursor?: string; limit?: unknown } = {},
	) => {
		const scope = input.scope ?? 'all'
		if (scope !== 'all' && scope !== 'following')
			throw new AppError('VALIDATION_FAILED', { scope: 'INVALID_FORMAT' })
		if (scope === 'following' && !viewer) throw new AppError('UNAUTHENTICATED')
		return posts.list({ viewerId: viewer?.id ?? null, scope, ...pageQuery(input) })
	}

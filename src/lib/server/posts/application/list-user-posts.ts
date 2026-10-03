import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from '../../shared/domain/page-query'
import type { AuthorDirectory, PostRepository } from './ports'

function parseType(value: unknown): 'post' | 'reel' | undefined {
	if (value === undefined || value === 'post' || value === 'reel') return value
	throw new AppError('VALIDATION_FAILED', { type: 'INVALID_FORMAT' })
}

export const listUserPosts =
	(deps: { posts: PostRepository; authors: AuthorDirectory }) =>
	async (
		viewer: Viewer | null,
		input: { username?: unknown; type?: unknown; cursor?: string; limit?: unknown },
	) => {
		const type = parseType(input.type)
		const authorId =
			typeof input.username === 'string' && input.username
				? await deps.authors.findIdByUsername(input.username)
				: null
		if (!authorId) throw new AppError('NOT_FOUND')
		return deps.posts.list({
			viewerId: viewer?.id ?? null,
			scope: 'all',
			type,
			authorId,
			...pageQuery(input),
		})
	}

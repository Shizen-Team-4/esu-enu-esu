import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from './page-query'
import type { PostRepository } from './ports'

export const listReels =
	(posts: PostRepository) =>
	async (viewer: Viewer | null, input: { cursor?: string; limit?: unknown } = {}) =>
		posts.list({ viewerId: viewer?.id ?? null, scope: 'all', type: 'reel', ...pageQuery(input) })

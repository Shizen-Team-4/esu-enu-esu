import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { pageQuery } from './page-query'
import type { PostRepository } from './ports'

export const listSavedPosts =
	(posts: PostRepository) =>
	async (viewer: Viewer | null, input: { cursor?: string; limit?: unknown } = {}) =>
		posts.list({ viewerId: requireViewer(viewer).id, scope: 'saved', ...pageQuery(input) })

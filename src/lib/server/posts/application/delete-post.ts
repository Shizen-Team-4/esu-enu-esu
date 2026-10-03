import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { PostRepository } from './ports'

export const deletePost =
	(deps: { posts: PostRepository; clock: Clock }) => async (viewer: Viewer | null, id: string) => {
		const author = requireViewer(viewer)
		const post = await deps.posts.find(id, author.id)
		if (!post) throw new AppError('NOT_FOUND')
		if (post.author.id !== author.id) throw new AppError('FORBIDDEN')
		await deps.posts.delete(id, deps.clock.now())
		return { ok: true as const }
	}

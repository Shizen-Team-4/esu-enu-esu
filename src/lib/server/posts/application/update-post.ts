import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { validateCaption } from '../domain/post'
import type { PostRepository } from './ports'

export const updatePost =
	(deps: { posts: PostRepository; clock: Clock }) =>
	async (viewer: Viewer | null, id: string, caption: unknown) => {
		const author = requireViewer(viewer)
		const value = validateCaption(caption)
		const post = await deps.posts.find(id, author.id)
		if (!post) throw new AppError('NOT_FOUND')
		if (post.author.id !== author.id) throw new AppError('FORBIDDEN')
		if (!value && !post.media.length)
			throw new AppError('VALIDATION_FAILED', { caption: 'REQUIRED' })
		await deps.posts.update(id, value, deps.clock.now())
		return deps.posts.find(id, author.id)
	}

import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { validatePost } from '../domain/post'
import type { IdGenerator, PostRepository } from './ports'

export const createPost =
	(deps: { posts: PostRepository; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const author = requireViewer(viewer)
		const value = validatePost(input)
		const now = deps.clock.now()
		const window = await deps.posts.creationWindow(author.id, new Date(now.getTime() - 3600000))
		if (window.count >= 30) throw new AppError('RATE_LIMITED')
		if (!(await deps.posts.checkMedia(value.mediaIds, author.id, value.type)))
			throw new AppError('VALIDATION_FAILED', { mediaIds: 'INVALID_FORMAT' })
		const id = deps.ids.generate('pst')
		await deps.posts.create(id, author.id, value, now)
		const post = await deps.posts.find(id, author.id)
		if (!post) throw new AppError('INTERNAL')
		return post
	}

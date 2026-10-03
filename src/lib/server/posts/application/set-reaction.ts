import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { PostRepository } from './ports'

export async function setReaction(
	deps: { posts: PostRepository; clock: Clock },
	viewer: Viewer | null,
	id: string,
	kind: 'like' | 'save',
	active: boolean,
) {
	const user = requireViewer(viewer)
	if (!(await deps.posts.find(id, user.id))) throw new AppError('NOT_FOUND')
	await deps.posts.react(id, user.id, kind, active, deps.clock.now())
	const post = await deps.posts.find(id, user.id)
	if (!post) throw new AppError('NOT_FOUND')
	return post
}

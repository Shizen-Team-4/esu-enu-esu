import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { PostRepository } from './ports'

export const reactToPost =
	(deps: { posts: PostRepository; clock: Clock }) =>
	async (viewer: Viewer | null, id: string, kind: 'like' | 'save', active: boolean) => {
		const author = requireViewer(viewer)
		if (!(await deps.posts.find(id, author.id))) throw new AppError('NOT_FOUND')
		await deps.posts.react(id, author.id, kind, active, deps.clock.now())
		return deps.posts.find(id, author.id)
	}

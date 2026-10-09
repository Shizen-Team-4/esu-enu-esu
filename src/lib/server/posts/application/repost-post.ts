import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock, IdGenerator } from '../../shared/application/ports'
import type { Notifier } from '../../shared/application/notifier'
import {
	CREATION_RATE_LIMIT,
	CREATION_RATE_WINDOW_MS,
	retryAfterSec,
} from '../../shared/domain/creation-rate-limit'
import type { PostRepository } from './ports'

export const repostPost =
	(deps: {
		posts: PostRepository
		social: {
			createRepost(id: string, authorId: string, originalId: string, now: Date): Promise<void>
		}
		clock: Clock
		ids: IdGenerator
		notifier: Notifier
	}) =>
	async (viewer: Viewer | null, id: string) => {
		const actor = requireViewer(viewer)
		const shared = await deps.posts.find(id, actor.id)
		if (!shared) throw new AppError('NOT_FOUND')
		const originalId = shared.repostOfId ?? shared.id
		if (originalId !== shared.id && !(await deps.posts.find(originalId, actor.id)))
			throw new AppError('NOT_FOUND')
		const now = deps.clock.now()
		const window = await deps.posts.creationWindow(
			actor.id,
			new Date(now.getTime() - CREATION_RATE_WINDOW_MS),
		)
		if (window.count >= CREATION_RATE_LIMIT)
			throw new AppError('RATE_LIMITED', undefined, retryAfterSec(window.oldest, now))
		const repostId = deps.ids.generate('pst')
		await deps.social.createRepost(repostId, actor.id, originalId, now)
		const repost = await deps.posts.find(repostId, actor.id)
		if (!repost) throw new AppError('INTERNAL')
		deps.notifier.notify({ type: 'post', actorId: actor.id, postId: repostId, createdAt: now })
		return repost
	}

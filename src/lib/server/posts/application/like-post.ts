import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Notifier } from '../../shared/application/notifier'
import type { Clock } from '../../shared/application/ports'
import { setReaction } from './set-reaction'
import type { PostRepository } from './ports'

export const likePost =
	(deps: { posts: PostRepository; clock: Clock; notifier: Notifier }) =>
	async (viewer: Viewer | null, id: string) => {
		const actor = requireViewer(viewer)
		const { post, created, now } = await setReaction(deps, actor, id, 'like', true)
		if (created)
			deps.notifier.notify({
				type: 'like',
				actorId: actor.id,
				recipientId: post.author.id,
				postId: id,
				createdAt: now,
			})
		return { liked: post.viewer.liked, likes: post.counts.likes }
	}

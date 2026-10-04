import type { Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { setReaction } from './set-reaction'
import type { PostRepository } from './ports'

export const unlikePost =
	(deps: { posts: PostRepository; clock: Clock }) => async (viewer: Viewer | null, id: string) => {
		const post = await setReaction(deps, viewer, id, 'like', false)
		return { liked: post.viewer.liked, likes: post.counts.likes }
	}

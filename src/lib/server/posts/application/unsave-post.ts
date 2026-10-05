import type { Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { setReaction } from './set-reaction'
import type { PostRepository } from './ports'

export const unsavePost =
	(deps: { posts: PostRepository; clock: Clock }) => async (viewer: Viewer | null, id: string) => {
		const { post } = await setReaction(deps, viewer, id, 'save', false)
		return { saved: post.viewer.saved }
	}

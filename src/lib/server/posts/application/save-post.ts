import type { Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { setReaction } from './set-reaction'
import type { PostRepository } from './ports'

export const savePost =
	(deps: { posts: PostRepository; clock: Clock }) => async (viewer: Viewer | null, id: string) => {
		const post = await setReaction(deps, viewer, id, 'save', true)
		return { saved: post.viewer.saved }
	}

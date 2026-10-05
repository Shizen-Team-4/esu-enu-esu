import type { Post } from '$lib/types/post'

export type PostMenuAction = 'edit' | 'delete' | 'report'

/** Only the author can edit or delete (contract 3.3); everyone else can report. */
export function postMenuActions(post: Pick<Post, 'viewer'>): PostMenuAction[] {
	return post.viewer.isAuthor ? ['edit', 'delete'] : ['report']
}

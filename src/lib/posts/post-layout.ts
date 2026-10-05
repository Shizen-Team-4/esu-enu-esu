import type { Post } from '$lib/types/post'

export type PostLayout = 'text' | 'single' | 'gallery' | 'reel'

/** Picks the card layout from the table in api-contract.md section 3.3. */
export function postLayout(post: Pick<Post, 'type' | 'media'>): PostLayout {
	if (post.type === 'reel') return 'reel'
	if (post.media.length === 0) return 'text'
	return post.media.length === 1 ? 'single' : 'gallery'
}

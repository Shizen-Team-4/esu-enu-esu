import type { Media } from './media'
import type { UserSummary } from './user'

export type PostType = 'post' | 'reel'

export interface Post {
	id: string
	type: PostType
	author: UserSummary
	/** "" if none */
	caption: string
	/** post: 0-10; reel: exactly 1 video */
	media: Media[]
	/** comments includes replies */
	counts: { likes: number; comments: number }
	viewer: { liked: boolean; saved: boolean; isAuthor: boolean }
	shareUrl: string
	/** Set for a repost. The original is null if it has been removed. */
	repostOfId?: string | null
	original?: Post | null
	activity?: { likedBy: UserSummary[] }
	createdAt: string
	/** not null: the UI shows "edited" */
	editedAt: string | null
}

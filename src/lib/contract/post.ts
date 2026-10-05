import type { Media } from './media'
import type { UserSummary } from './user'

export interface Post {
	id: string
	type: 'post' | 'reel'
	author: UserSummary
	caption: string
	media: Media[]
	counts: { likes: number; comments: number }
	viewer: { liked: boolean; saved: boolean; isAuthor: boolean }
	shareUrl: string
	createdAt: string
	editedAt: string | null
}

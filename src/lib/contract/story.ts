import type { Media } from './media'
import type { UserSummary } from './user'

export interface Story {
	id: string
	author: UserSummary
	media: Media
	createdAt: string
	expiresAt: string
	viewer: { seen: boolean; liked: boolean }
	likes: number
}
export interface StoryTrayItem {
	user: UserSummary
	hasUnseen: boolean
	storyCount: number
	latestAt: string
}

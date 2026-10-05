import type { Cursor } from '../../shared/domain/cursor'
import type { Page, UserSummary } from '$lib/contract'
export interface StoryViewer {
	user: UserSummary
	viewedAt: string
	liked: boolean
}
export interface StoryAudience extends Page<StoryViewer> {
	total: number
}
export interface StoryAudienceRepository {
	list(
		id: string,
		authorId: string,
		now: Date,
		query: { cursor?: Cursor; limit: number },
	): Promise<StoryAudience>
}

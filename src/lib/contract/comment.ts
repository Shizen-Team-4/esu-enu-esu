import type { UserSummary } from './user'

export interface Comment {
	id: string
	postId: string
	author: UserSummary
	body: string
	parentId: string | null
	replyToUser: UserSummary | null
	replyCount: number
	viewer: { canDelete: boolean }
	createdAt: string
}

import type { UserSummary } from './user'

export type NotificationType = 'post' | 'like' | 'comment' | 'reply' | 'follow'

export interface Notification {
	id: string
	type: NotificationType
	actor: UserSummary | null
	post: { id: string; type: 'post' | 'reel' } | null
	commentId: string | null
	createdAt: string
	readAt: string | null
}

import type { Page } from '$lib/contract'
import type { Cursor } from '../../shared/domain/cursor'
import type { Notification, NotificationDraft } from '../domain/notification'

export interface NotificationRepository {
	create(drafts: (NotificationDraft & { id: string })[]): Promise<void>
	list(recipientId: string, page: { cursor?: Cursor; limit: number }): Promise<Page<Notification>>
	unreadCount(recipientId: string): Promise<number>
	markRead(recipientId: string, id: string, now: Date): Promise<Notification | null>
	markAllRead(recipientId: string, now: Date): Promise<void>
}

export interface NotificationFollowers {
	listIds(authorId: string, publishedAt: Date): Promise<string[]>
}

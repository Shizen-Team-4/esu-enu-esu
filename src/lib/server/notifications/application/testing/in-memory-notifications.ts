import type { Notification } from '$lib/contract'
import { encodeCursor } from '../../../shared/domain/cursor'
import type { NotificationRepository } from '../ports'

export function aNotification(overrides: Partial<Notification> = {}): Notification {
	return {
		id: 'ntf_1',
		type: 'like',
		actor: { id: 'usr_2', username: 'dara', displayName: 'Dara', avatarUrl: null },
		post: { id: 'pst_1', type: 'post' },
		commentId: null,
		createdAt: '2026-10-03T00:00:00.000Z',
		readAt: null,
		...overrides,
	}
}

export class InMemoryNotifications implements NotificationRepository {
	rows: (Notification & { recipientId: string; dedupeKey: string })[] = []
	async create(drafts: Parameters<NotificationRepository['create']>[0]) {
		for (const draft of drafts) {
			if (this.rows.some((row) => row.dedupeKey === draft.dedupeKey)) continue
			this.rows.push({
				...aNotification({
					id: draft.id,
					type: draft.type,
					actor: {
						id: draft.actorId,
						username: draft.actorId,
						displayName: draft.actorId,
						avatarUrl: null,
					},
					post: draft.postId ? { id: draft.postId, type: 'post' } : null,
					commentId: draft.commentId,
					createdAt: draft.createdAt.toISOString(),
				}),
				recipientId: draft.recipientId,
				dedupeKey: draft.dedupeKey,
			})
		}
	}
	async list(recipientId: string, page: Parameters<NotificationRepository['list']>[1]) {
		const rows = this.rows
			.filter((row) => {
				const time = Date.parse(row.createdAt)
				return (
					row.recipientId === recipientId &&
					(!page.cursor ||
						time < page.cursor.time ||
						(time === page.cursor.time && row.id < page.cursor.id))
				)
			})
			.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? 1 : -1))
		const items = rows.slice(0, page.limit)
		const last = items.at(-1)
		return {
			items,
			nextCursor:
				rows.length > page.limit && last
					? encodeCursor({ time: Date.parse(last.createdAt), id: last.id })
					: null,
		}
	}
	async unreadCount(recipientId: string) {
		return this.rows.filter((row) => row.recipientId === recipientId && row.readAt === null).length
	}
	async markRead(recipientId: string, id: string, now: Date) {
		const row = this.rows.find((row) => row.id === id && row.recipientId === recipientId)
		if (!row) return null
		row.readAt ??= now.toISOString()
		return row
	}
	async markAllRead(recipientId: string, now: Date) {
		for (const row of this.rows)
			if (row.recipientId === recipientId) row.readAt ??= now.toISOString()
	}
}

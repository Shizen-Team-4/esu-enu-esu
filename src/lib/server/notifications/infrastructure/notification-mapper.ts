import type { Notification } from '../domain/notification'

export interface NotificationRow {
	id: string
	type: Notification['type']
	actorId: string | null
	username: string | null
	name: string | null
	image: string | null
	postId: string | null
	postType: 'post' | 'reel' | null
	commentId: string | null
	createdAt: number
	readAt: number | null
}

export function toNotification(row: NotificationRow): Notification {
	const post = row.postId && row.postType ? { id: row.postId, type: row.postType } : null
	return {
		id: row.id,
		type: row.type,
		actor:
			row.actorId && row.username && row.name
				? {
						id: row.actorId,
						username: row.username,
						displayName: row.name,
						avatarUrl: row.image,
					}
				: null,
		post,
		commentId: post ? row.commentId : null,
		createdAt: new Date(row.createdAt).toISOString(),
		readAt: row.readAt === null ? null : new Date(row.readAt).toISOString(),
	}
}

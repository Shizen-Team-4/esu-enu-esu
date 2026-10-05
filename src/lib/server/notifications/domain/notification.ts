import type { Notification, NotificationType } from '$lib/contract'
import type { NotificationEvent } from '../../shared/domain/notification-event'
import { AppError } from '../../shared/domain/app-error'

export type { Notification }

export interface NotificationDraft {
	recipientId: string
	type: NotificationType
	actorId: string
	postId: string | null
	commentId: string | null
	dedupeKey: string
	createdAt: Date
}

export function notificationRecipients(event: NotificationEvent, followers: string[] = []) {
	const recipients = new Map<string, NotificationType>()
	if (event.type === 'post') {
		for (const id of followers) recipients.set(id, 'post')
	} else if (event.type === 'comment') {
		recipients.set(event.postAuthorId, 'comment')
		if (event.replyAuthorId) recipients.set(event.replyAuthorId, 'reply')
	} else recipients.set(event.recipientId, event.type)
	recipients.delete(event.actorId)
	return [...recipients].map(([recipientId, type]): NotificationDraft => {
		return {
			recipientId,
			type,
			actorId: event.actorId,
			postId: event.type === 'follow' ? null : event.postId,
			commentId: event.type === 'comment' ? event.commentId : null,
			dedupeKey: notificationDedupeKey(event, recipientId),
			createdAt: event.createdAt,
		}
	})
}

function notificationDedupeKey(event: NotificationEvent, recipientId: string) {
	if (event.type === 'post') return `post:${event.postId}:${recipientId}`
	if (event.type === 'comment') return `comment:${event.commentId}:${recipientId}`
	const target = event.type === 'follow' ? recipientId : event.postId
	return `${event.type}:${event.actorId}:${target}`
}

export function validateNotificationId(value: unknown): string {
	if (typeof value !== 'string' || !/^ntf_[A-Za-z0-9_-]{1,128}$/.test(value))
		throw new AppError('VALIDATION_FAILED', { id: 'INVALID_FORMAT' })
	return value
}

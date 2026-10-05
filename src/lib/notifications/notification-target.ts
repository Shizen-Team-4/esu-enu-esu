import type { Notification } from '$lib/contract'

export function notificationTarget(notification: Notification): string | null {
	if (notification.type === 'follow')
		return notification.actor ? `/u/${encodeURIComponent(notification.actor.username)}` : null
	if (!notification.post) return null
	return `/p/${encodeURIComponent(notification.post.id)}${notification.commentId ? '#comments' : ''}`
}

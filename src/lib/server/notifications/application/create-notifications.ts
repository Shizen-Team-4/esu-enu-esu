import type { IdGenerator } from '../../shared/application/ports'
import type { NotificationEvent } from '../../shared/application/notifier'
import { notificationRecipients } from '../domain/notification'
import type { NotificationFollowers, NotificationRepository } from './ports'

export const createNotifications =
	(deps: {
		notifications: NotificationRepository
		followers: NotificationFollowers
		ids: IdGenerator
	}) =>
	async (event: NotificationEvent) => {
		const followers =
			event.type === 'post' ? await deps.followers.listIds(event.actorId, event.createdAt) : []
		const drafts = notificationRecipients(event, followers)
		if (drafts.length)
			await deps.notifications.create(
				drafts.map((draft) => ({ ...draft, id: deps.ids.generate('ntf') })),
			)
	}

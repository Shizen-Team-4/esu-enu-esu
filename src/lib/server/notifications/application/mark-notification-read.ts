import type { Clock } from '../../shared/application/ports'
import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { validateNotificationId } from '../domain/notification'
import type { NotificationRepository } from './ports'

export const markNotificationRead =
	(deps: { notifications: NotificationRepository; clock: Clock }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const user = requireViewer(viewer)
		const id = validateNotificationId(input)
		const notification = await deps.notifications.markRead(user.id, id, deps.clock.now())
		if (!notification) throw new AppError('NOT_FOUND')
		return notification
	}

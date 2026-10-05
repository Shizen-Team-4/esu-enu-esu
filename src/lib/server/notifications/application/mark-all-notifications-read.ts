import type { Clock } from '../../shared/application/ports'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { NotificationRepository } from './ports'

export const markAllNotificationsRead =
	(deps: { notifications: NotificationRepository; clock: Clock }) =>
	async (viewer: Viewer | null) => {
		const user = requireViewer(viewer)
		await deps.notifications.markAllRead(user.id, deps.clock.now())
	}

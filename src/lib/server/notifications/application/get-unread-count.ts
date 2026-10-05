import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { NotificationRepository } from './ports'

export const getUnreadCount =
	(notifications: NotificationRepository) => async (viewer: Viewer | null) => {
		const user = requireViewer(viewer)
		return { unreadCount: await notifications.unreadCount(user.id) }
	}

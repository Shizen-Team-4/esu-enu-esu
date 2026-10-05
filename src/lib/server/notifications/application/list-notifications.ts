import { decodeCursor, parseLimit } from '../../shared/domain/cursor'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { NotificationRepository } from './ports'

export const listNotifications =
	(notifications: NotificationRepository) =>
	async (viewer: Viewer | null, input: { cursor?: string; limit?: unknown } = {}) => {
		const user = requireViewer(viewer)
		return notifications.list(user.id, {
			cursor: input.cursor === undefined ? undefined : decodeCursor(input.cursor),
			limit: parseLimit(input.limit),
		})
	}

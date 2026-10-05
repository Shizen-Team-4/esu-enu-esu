import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { MessageRepository } from './ports'
export const getMessageCount = (messages: MessageRepository) => async (viewer: Viewer | null) => ({
	unreadCount: await messages.unread(requireViewer(viewer).id),
})

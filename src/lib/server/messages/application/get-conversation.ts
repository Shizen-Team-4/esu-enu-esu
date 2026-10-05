import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { AppError } from '../../shared/domain/app-error'
import { messageId, messageSequence } from '../domain/message'
import type { MessageRepository } from './ports'
export const getConversation =
	(messages: MessageRepository) => async (viewer: Viewer | null, id: unknown, before?: unknown) => {
		const actor = requireViewer(viewer)
		const threadId = messageId(id, 'dm')
		const boundary = before === undefined ? undefined : messageSequence(before)
		const conversation = await messages.find(threadId, actor.id)
		if (!conversation) throw new AppError('NOT_FOUND')
		return { conversation, ...(await messages.history(threadId, boundary)) }
	}

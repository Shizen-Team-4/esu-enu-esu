import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { AppError } from '../../shared/domain/app-error'
import { messageId, messageSequence } from '../domain/message'
import type { MessageRepository } from './ports'
export const readConversation =
	(messages: MessageRepository) =>
	async (viewer: Viewer | null, id: unknown, sequence: unknown) => {
		const actor = requireViewer(viewer)
		const threadId = messageId(id, 'dm')
		const boundary = messageSequence(sequence)
		if (!(await messages.find(threadId, actor.id))) throw new AppError('NOT_FOUND')
		await messages.read(threadId, actor.id, boundary)
		return { read: true }
	}

import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { AppError } from '../../shared/domain/app-error'
import { messageId } from '../domain/message'
import type { MessageRepository } from './ports'
import type { Clock, IdGenerator } from '../../shared/application/ports'
export const startConversation =
	(deps: { messages: MessageRepository; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, recipient: unknown) => {
		const actor = requireViewer(viewer)
		const recipientId = messageId(recipient, 'usr')
		if (recipientId === actor.id)
			throw new AppError('VALIDATION_FAILED', { recipient: 'NOT_ALLOWED' })
		return {
			id: await deps.messages.start({
				id: deps.ids.generate('dm'),
				viewerId: actor.id,
				recipientId,
				now: deps.clock.now().getTime(),
			}),
		}
	}

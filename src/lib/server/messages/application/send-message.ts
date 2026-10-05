import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { AppError } from '../../shared/domain/app-error'
import { messageId, messageBody } from '../domain/message'
import type { MessageRepository } from './ports'
import type { Clock } from '../../shared/application/ports'
export const sendMessage =
	(deps: { messages: MessageRepository; clock: Clock }) =>
	async (viewer: Viewer | null, input: { threadId: unknown; id: unknown; body: unknown }) => {
		const actor = requireViewer(viewer)
		const threadId = messageId(input.threadId, 'dm')
		const id = messageId(input.id, 'msg')
		const body = messageBody(input.body)
		if (!(await deps.messages.find(threadId, actor.id))) throw new AppError('NOT_FOUND')
		return deps.messages.send({
			id,
			threadId,
			senderId: actor.id,
			body,
			now: deps.clock.now().getTime(),
		})
	}

import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import { messageBody, messageId } from '../../messages/domain/message'
import type { StoryRepository } from './ports'

type ConversationStarter = (viewer: Viewer, recipientId: string) => Promise<{ id: string }>
type MessageSender = (
	viewer: Viewer,
	input: { threadId: string; id: string; body: string },
) => Promise<unknown>

export const replyToStory =
	(deps: {
		stories: StoryRepository
		clock: Clock
		startConversation: ConversationStarter
		sendMessage: MessageSender
	}) =>
	async (viewer: Viewer | null, input: { storyId: unknown; id: unknown; body: unknown }) => {
		const actor = requireViewer(viewer)
		if (typeof input.storyId !== 'string' || !/^sty_[A-Za-z0-9_-]{1,100}$/.test(input.storyId))
			throw new AppError('VALIDATION_FAILED', { storyId: 'INVALID_FORMAT' })
		const storyId = input.storyId
		const id = messageId(input.id, 'msg')
		const body = messageBody(input.body)
		const story = await deps.stories.find(storyId, actor.id, deps.clock.now())
		if (!story || story.author.id === actor.id) throw new AppError('NOT_FOUND')
		const { id: threadId } = await deps.startConversation(actor, story.author.id)
		await deps.sendMessage(actor, { threadId, id, body: `↪ Story reply: ${body}` })
		return { threadId }
	}

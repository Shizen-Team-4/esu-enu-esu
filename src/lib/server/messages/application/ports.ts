import type { Conversation, ConversationPage, DirectMessage, Inbox } from '$lib/contract/message'
import type { Cursor } from '../../shared/domain/cursor'
export interface MessageRepository {
	start(input: { id: string; viewerId: string; recipientId: string; now: number }): Promise<string>
	list(viewerId: string, query: { cursor?: Cursor; limit: number }): Promise<Inbox>
	find(threadId: string, viewerId: string): Promise<Conversation | null>
	history(
		threadId: string,
		before?: number,
	): Promise<Pick<ConversationPage, 'messages' | 'nextBefore'>>
	send(input: {
		id: string
		threadId: string
		senderId: string
		body: string
		now: number
	}): Promise<DirectMessage>
	read(threadId: string, viewerId: string, sequence: number): Promise<void>
	unread(viewerId: string): Promise<number>
}

import type { UserSummary } from './user'
import type { Page } from './page'
export interface DirectMessage {
	id: string
	sequence: number
	senderId: string
	body: string
	createdAt: string
}
export interface Conversation {
	id: string
	peer: UserSummary
	lastMessage: string | null
	updatedAt: string
	unreadCount: number
	peerReadSequence: number
}
export interface ConversationPage {
	conversation: Conversation
	messages: DirectMessage[]
	nextBefore: number | null
}
export type Inbox = Page<Conversation>

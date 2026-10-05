import type { Conversation, DirectMessage } from '$lib/contract/message'
export interface ConversationRow {
	id: string
	peerId: string
	username: string
	name: string
	image: string | null
	updatedAt: number
	lastMessage: string | null
	unreadCount: number
	peerReadSequence: number
}
export interface MessageRow {
	id: string
	sequence: number
	senderId: string
	body: string
	createdAt: number
}
export const mapConversation = (row: ConversationRow): Conversation => ({
	id: row.id,
	peer: { id: row.peerId, username: row.username, displayName: row.name, avatarUrl: row.image },
	updatedAt: new Date(row.updatedAt).toISOString(),
	lastMessage: row.lastMessage,
	unreadCount: row.unreadCount,
	peerReadSequence: row.peerReadSequence,
})
export const mapMessage = (row: MessageRow): DirectMessage => ({
	...row,
	createdAt: new Date(row.createdAt).toISOString(),
})

import { describe, it, expect } from 'vitest'
import { startConversation } from './start-conversation'
import { getConversation } from './get-conversation'
import { listConversations } from './list-conversations'
import { sendMessage } from './send-message'
import { readConversation } from './read-conversation'
import { getMessageCount } from './get-message-count'
import type { MessageRepository } from './ports'
import type { Conversation, DirectMessage } from '$lib/contract/message'
const viewer = { id: 'usr_a', role: 'user' as const }
const thread: Conversation = {
	id: 'dm_a',
	peer: { id: 'usr_b', username: 'peer', displayName: 'Peer', avatarUrl: null },
	updatedAt: new Date(0).toISOString(),
	lastMessage: null,
	unreadCount: 0,
	peerReadSequence: 0,
}
class MemoryMessages implements MessageRepository {
	accessible = true
	records: DirectMessage[] = []
	readThrough = 0
	async start() {
		return 'dm_a'
	}
	async list() {
		return { items: [thread], nextCursor: null }
	}
	async find() {
		return this.accessible ? thread : null
	}
	async history() {
		return { messages: this.records, nextBefore: null }
	}
	async send(input: { id: string; senderId: string; body: string; now: number }) {
		const message = {
			id: input.id,
			sequence: 1,
			senderId: input.senderId,
			body: input.body,
			createdAt: new Date(input.now).toISOString(),
		}
		this.records.push(message)
		return message
	}
	async read(_id: string, _viewer: string, sequence: number) {
		this.readThrough = sequence
	}
	async unread() {
		return 3
	}
}
const setup = () => ({
	messages: new MemoryMessages(),
	clock: { now: () => new Date(1000) },
	ids: { generate: () => 'dm_new' },
})
describe('private messaging', () => {
	it('opens an existing or new conversation', async () => {
		const deps = setup()
		expect(await startConversation(deps)(viewer, 'usr_b')).toEqual({ id: 'dm_a' })
	})
	it('rejects self messaging and invalid recipients', async () => {
		const deps = setup()
		await expect(startConversation(deps)(viewer, viewer.id)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
		await expect(startConversation(deps)(viewer, 'no')).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
	it('requires authentication for every operation', async () => {
		const deps = setup()
		for (const call of [
			() => startConversation(deps)(null, 'usr_b'),
			() => getConversation(deps.messages)(null, 'dm_a'),
			() => listConversations(deps.messages)(null),
			() => sendMessage(deps)(null, { id: 'msg_a', threadId: 'dm_a', body: 'Hi' }),
			() => readConversation(deps.messages)(null, 'dm_a', 1),
			() => getMessageCount(deps.messages)(null),
		])
			await expect(async () => call()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
	it('returns history, older history and inbox', async () => {
		const { messages } = setup()
		expect((await getConversation(messages)(viewer, 'dm_a')).conversation.id).toBe('dm_a')
		expect((await getConversation(messages)(viewer, 'dm_a', '3')).messages).toEqual([])
		expect((await listConversations(messages)(viewer)).items).toHaveLength(1)
		expect(await getMessageCount(messages)(viewer)).toEqual({ unreadCount: 3 })
	})
	it('hides conversations from nonparticipants for reading and mutations', async () => {
		const deps = setup()
		deps.messages.accessible = false
		for (const call of [
			() => getConversation(deps.messages)(viewer, 'dm_a'),
			() => sendMessage(deps)(viewer, { threadId: 'dm_a', id: 'msg_a', body: 'hello' }),
			() => readConversation(deps.messages)(viewer, 'dm_a', 1),
		])
			await expect(call()).rejects.toMatchObject({ code: 'NOT_FOUND' })
		expect(deps.messages.records).toHaveLength(0)
	})
	it('validates pagination and read boundaries', async () => {
		const { messages } = setup()
		await expect(getConversation(messages)(viewer, 'dm_a', -1)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
		await expect(async () =>
			listConversations(messages)(viewer, { limit: 100 }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
		await expect(readConversation(messages)(viewer, 'dm_a', 'oops')).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
	it('sends trimmed Unicode text with an injected time and stable request id', async () => {
		const deps = setup()
		const message = await sendMessage(deps)(viewer, {
			threadId: 'dm_a',
			id: 'msg_a',
			body: '  ?????? ??  ',
		})
		expect(message).toMatchObject({
			id: 'msg_a',
			body: '?????? ??',
			createdAt: '1970-01-01T00:00:01.000Z',
		})
	})
	it('marks only the explicit read boundary', async () => {
		const { messages } = setup()
		expect(await readConversation(messages)(viewer, 'dm_a', 3)).toEqual({ read: true })
		expect(messages.readThrough).toBe(3)
	})
})

import { readApiError } from '$lib/api/api-error'
import type { ConversationPage, DirectMessage } from '$lib/contract/message'
export async function fetchMessageCount(
	signal: AbortSignal,
	fetchFn: typeof fetch = fetch,
): Promise<number> {
	const response = await fetchFn('/api/messages/unread', { signal, cache: 'no-store' })
	if (!response.ok) throw await readApiError(response)
	return ((await response.json()) as { unreadCount: number }).unreadCount
}
export async function fetchConversation(
	id: string,
	before?: number,
	fetchFn: typeof fetch = fetch,
): Promise<ConversationPage> {
	const response = await fetchFn(
		'/api/messages/' + encodeURIComponent(id) + (before ? '?before=' + before : ''),
		{ cache: 'no-store' },
	)
	if (!response.ok) throw await readApiError(response)
	return response.json()
}
export async function markConversationRead(
	id: string,
	sequence: number,
	fetchFn: typeof fetch = fetch,
) {
	const response = await fetchFn('/api/messages/' + encodeURIComponent(id), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ sequence }),
	})
	if (!response.ok) throw await readApiError(response)
}
export function mergeMessages(
	previous: DirectMessage[],
	incoming: DirectMessage[],
): DirectMessage[] {
	const unique = new Map(previous.map((message) => [message.id, message]))
	for (const message of incoming) unique.set(message.id, message)
	return [...unique.values()].sort((a, b) => a.sequence - b.sequence)
}
export const newMessageId = () => 'msg_' + crypto.randomUUID().replaceAll('-', '')

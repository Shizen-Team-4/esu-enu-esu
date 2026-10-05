import { readApiError } from '$lib/api/api-error'
import type { Notification, Page } from '$lib/contract'

export async function fetchNotifications(
	cursor: string | null = null,
	fetchFn: typeof fetch = fetch,
): Promise<Page<Notification>> {
	const params = new URLSearchParams()
	if (cursor !== null) params.set('cursor', cursor)
	const response = await fetchFn(`/api/notifications?${params}`, { cache: 'no-store' })
	if (!response.ok) throw await readApiError(response)
	return response.json()
}

export async function fetchUnreadCount(signal: AbortSignal, fetchFn: typeof fetch = fetch) {
	const response = await fetchFn('/api/notifications/unread', { signal, cache: 'no-store' })
	if (!response.ok) throw await readApiError(response)
	const data: { unreadCount: number } = await response.json()
	return data.unreadCount
}

import { describe, expect, it, vi } from 'vitest'
import { fetchNotifications, fetchUnreadCount } from './fetch-notifications'

describe('notification requests', () => {
	it('loads the first page without a cursor and disables caching', async () => {
		const page = { items: [], nextCursor: null }
		const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(Response.json(page))
		expect(await fetchNotifications(null, fetchFn)).toEqual(page)
		expect(fetchFn).toHaveBeenCalledWith('/api/notifications?', { cache: 'no-store' })
	})
	it('encodes pagination cursors', async () => {
		const fetchFn = vi
			.fn<typeof fetch>()
			.mockResolvedValue(Response.json({ items: [], nextCursor: null }))
		await fetchNotifications('a+b/=x', fetchFn)
		expect(fetchFn).toHaveBeenCalledWith('/api/notifications?cursor=a%2Bb%2F%3Dx', {
			cache: 'no-store',
		})
	})
	it('loads the unread count with cancellation and no cache', async () => {
		const signal = new AbortController().signal
		const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ unreadCount: 5 }))
		expect(await fetchUnreadCount(signal, fetchFn)).toBe(5)
		expect(fetchFn).toHaveBeenCalledWith('/api/notifications/unread', { signal, cache: 'no-store' })
	})
	it.each(['list', 'count'])('maps %s error envelopes', async (kind) => {
		const fetchFn = vi
			.fn<typeof fetch>()
			.mockResolvedValue(Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }))
		const request =
			kind === 'list'
				? fetchNotifications(null, fetchFn)
				: fetchUnreadCount(new AbortController().signal, fetchFn)
		await expect(request).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
	it('preserves network failures for retry handling', async () => {
		const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
		await expect(fetchNotifications(null, fetchFn)).rejects.toThrow('offline')
	})
})

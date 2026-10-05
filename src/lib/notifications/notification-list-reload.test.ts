import { describe, expect, it } from 'vitest'
import type { Notification, Page } from '$lib/contract'
import { aNotification } from '$lib/server/notifications/application/testing/in-memory-notifications'
import { createNotificationList } from './notification-list'

const page = (ids: string[], nextCursor: string | null = null): Page<Notification> => ({
	items: ids.map((id) => aNotification({ id })),
	nextCursor,
})

describe('notification server reloads', () => {
	it('preserves rows, pagination and loaded depth when a same-cursor server reload fails', async () => {
		const requests: (string | null)[] = []
		const state = createNotificationList(
			page(['ntf_3'], 'next'),
			async (cursor) => {
				requests.push(cursor)
				return cursor === null ? page(['ntf_3'], 'next') : page(['ntf_2'], 'older')
			},
			() => {},
		)
		await state.loadMore()
		const loaded = state.snapshot

		state.reset(null, null, 'INTERNAL')

		expect(state.snapshot).toEqual({ ...loaded, errorCode: 'INTERNAL' })
		expect(state.snapshot.items).toBe(loaded.items)
		await state.retry()
		expect(requests).toEqual(['next', null, 'next'])
		expect(state.snapshot).toEqual({ ...loaded, errorCode: null })
	})

	it('retries the failed server reload rather than a previously failed pagination request', async () => {
		const requests: (string | null)[] = []
		let fail = true
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			async (cursor) => {
				requests.push(cursor)
				if (fail) throw new Error('offline')
				return page(['ntf_3'])
			},
			() => {},
		)
		await state.loadMore()
		state.reset(null, null, 'INTERNAL')
		fail = false
		await state.retry()
		expect(requests).toEqual(['next', null])
		expect(state.snapshot.items.map((item) => item.id)).toEqual(['ntf_3'])
	})

	it('resets rows and loaded depth after a successful server reload', async () => {
		const requests: (string | null)[] = []
		const state = createNotificationList(
			page(['ntf_3'], 'next'),
			async (cursor) => {
				requests.push(cursor)
				return cursor === null ? page(['ntf_4'], 'next') : page(['ntf_2'])
			},
			() => {},
		)
		await state.loadMore()
		state.reset(null, null, 'INTERNAL')
		state.reset(page(['ntf_4'], 'next'), null)
		expect(state.snapshot).toMatchObject({ items: [{ id: 'ntf_4' }], errorCode: null })
		await state.refresh()
		expect(requests).toEqual(['next', null])
	})

	it('clears stale rows and retries from the new cursor when navigation fails', async () => {
		const requests: (string | null)[] = []
		const state = createNotificationList(
			page(['ntf_3'], 'next'),
			async (cursor) => {
				requests.push(cursor)
				return page(['ntf_1'])
			},
			() => {},
		)
		state.reset(null, 'older-page', 'INTERNAL')
		expect(state.snapshot).toEqual({
			items: [],
			nextCursor: null,
			loading: false,
			errorCode: 'INTERNAL',
		})
		await state.retry()
		expect(requests).toEqual(['older-page'])
		expect(state.snapshot.items.map((item) => item.id)).toEqual(['ntf_1'])
	})

	it('ignores a pending refresh after receiving a server-load failure', async () => {
		let resolve: (value: Page<Notification>) => void = () => {}
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			() =>
				new Promise((done) => {
					resolve = done
				}),
			() => {},
		)
		const pending = state.refresh()
		state.reset(null, null, 'INTERNAL')
		resolve(page(['ntf_3']))
		await pending
		expect(state.snapshot).toEqual({
			...page(['ntf_2'], 'next'),
			loading: false,
			errorCode: 'INTERNAL',
		})
	})
})

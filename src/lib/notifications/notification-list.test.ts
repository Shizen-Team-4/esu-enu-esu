import { describe, expect, it } from 'vitest'
import type { Notification, Page } from '$lib/contract'
import { aNotification } from '$lib/server/notifications/application/testing/in-memory-notifications'
import { createNotificationList } from './notification-list'

const page = (ids: string[], nextCursor: string | null = null): Page<Notification> => ({
	items: ids.map((id) => aNotification({ id })),
	nextCursor,
})

describe('notification list', () => {
	it('keeps an initial server failure distinct from an empty inbox and recovers on retry', async () => {
		const state = createNotificationList(
			page([]),
			async () => page(['ntf_1']),
			() => {},
			'INTERNAL',
		)
		expect(state.snapshot.errorCode).toBe('INTERNAL')
		await state.retry()
		expect(state.snapshot).toMatchObject({ errorCode: null, items: [{ id: 'ntf_1' }] })
		state.reset(page([]), null, 'INTERNAL')
		expect(state.snapshot.errorCode).toBe('INTERNAL')
	})
	it('appends pagination and deduplicates overlaps', async () => {
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			async () => page(['ntf_2', 'ntf_1']),
			() => {},
		)
		await state.loadMore()
		expect(state.snapshot.items.map((item) => item.id)).toEqual(['ntf_2', 'ntf_1'])
		expect(state.snapshot.nextCursor).toBeNull()
		expect(state.snapshot.loading).toBe(false)
		await state.loadMore()
	})
	it('refreshes loaded depth, including older read state and newly arrived notifications', async () => {
		const requests: (string | null)[] = []
		let phase = 'more'
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			async (cursor) => {
				requests.push(cursor)
				if (phase === 'more') return page(['ntf_1'])
				return cursor === null ? page(['ntf_3', 'ntf_2'], 'next') : page(['ntf_1'])
			},
			() => {},
		)
		await state.loadMore()
		phase = 'refresh'
		await state.refresh()
		expect(requests).toEqual(['next', null, 'next'])
		expect(state.snapshot.items.map((item) => item.id)).toEqual(['ntf_3', 'ntf_2', 'ntf_1'])
	})
	it('keeps loaded rows and retries a failed pagination request', async () => {
		let fail = true
		const cursors: (string | null)[] = []
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			async (cursor) => {
				cursors.push(cursor)
				if (fail) throw new Error('offline')
				return page(['ntf_1'])
			},
			() => {},
		)
		await state.loadMore()
		expect(state.snapshot).toMatchObject({ errorCode: 'INTERNAL', items: [{ id: 'ntf_2' }] })
		fail = false
		await state.retry()
		expect(cursors).toEqual(['next', 'next'])
		expect(state.snapshot.errorCode).toBeNull()
	})
	it('retries a failed refresh without clearing history', async () => {
		let fail = true
		const state = createNotificationList(
			page(['ntf_1']),
			async () => {
				if (fail) throw null
				return page([])
			},
			() => {},
		)
		await state.refresh()
		expect(state.snapshot.items).toHaveLength(1)
		fail = false
		await state.retry()
		expect(state.snapshot.items).toHaveLength(0)
	})
	it('reports session expiry as a terminal polling result', async () => {
		const state = createNotificationList(
			page([]),
			async () => {
				throw { code: 'UNAUTHENTICATED' }
			},
			() => {},
		)
		expect(await state.refresh()).toBe(false)
		expect(state.snapshot.errorCode).toBe('UNAUTHENTICATED')
	})
	it('prevents overlap and ignores stale results after a reset', async () => {
		let resolve: (value: Page<Notification>) => void = () => {}
		let count = 0
		const state = createNotificationList(
			page(['ntf_2'], 'next'),
			() => {
				count++
				return new Promise((done) => {
					resolve = done
				})
			},
			() => {},
		)
		const pending = state.refresh()
		await state.loadMore()
		expect(count).toBe(1)
		state.reset(page(['ntf_3']), 'base')
		resolve(page(['ntf_1']))
		await pending
		expect(state.snapshot.items.map((item) => item.id)).toEqual(['ntf_3'])
	})
	it('uses the original cursor when refreshing a directly opened older page', async () => {
		const requests: (string | null)[] = []
		const state = createNotificationList(
			page([]),
			async (cursor) => {
				requests.push(cursor)
				return page([])
			},
			() => {},
		)
		state.reset(page(['ntf_1']), 'base')
		await state.refresh()
		expect(requests).toEqual(['base'])
	})
	it('does not publish errors or results after disposal', async () => {
		let reject: (cause: unknown) => void = () => {}
		let updates = 0
		const state = createNotificationList(
			page(['ntf_1']),
			() =>
				new Promise((_done, fail) => {
					reject = fail
				}),
			() => {
				updates++
			},
		)
		const pending = state.refresh()
		state.dispose()
		reject(new Error('offline'))
		await pending
		expect(updates).toBe(1)
	})
})

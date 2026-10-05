import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createUnreadCount } from './unread-count'

describe('unread count', () => {
	it('loads current state while retaining the server-rendered initial count', async () => {
		const state = createUnreadCount(3, async () => 4)
		expect(get(state)).toBe(3)
		expect(await state.refresh()).toBe(true)
		expect(get(state)).toBe(4)
	})
	it.each([new Error('offline'), null, { code: 'INTERNAL' }])(
		'retains previous state after failure %j',
		async (cause) => {
			const state = createUnreadCount(3, async () => {
				throw cause
			})
			expect(await state.refresh()).toBe(true)
			expect(get(state)).toBe(3)
		},
	)
	it('signals that polling should stop after session expiry', async () => {
		const state = createUnreadCount(3, async () => {
			throw { code: 'UNAUTHENTICATED' }
		})
		expect(await state.refresh()).toBe(false)
		expect(get(state)).toBe(3)
	})
	it('preserves a count on a failed same-viewer server load but clears it for a new viewer', () => {
		const state = createUnreadCount(3, async () => 4)
		state.reset(null, true)
		expect(get(state)).toBe(3)
		state.reset(null)
		expect(get(state)).toBeNull()
	})
	it('coalesces concurrent refreshes', async () => {
		let resolve: (value: number) => void = () => {}
		const state = createUnreadCount(
			null,
			() =>
				new Promise<number>((done) => {
					resolve = done
				}),
		)
		const first = state.refresh()
		expect(state.refresh()).toBe(first)
		resolve(5)
		await first
		expect(get(state)).toBe(5)
	})
	it('cancels old requests and ignores stale counts after reset', async () => {
		let resolve: (value: number) => void = () => {}
		let signal: AbortSignal | undefined
		const state = createUnreadCount(3, (value) => {
			signal = value
			return new Promise<number>((done) => {
				resolve = done
			})
		})
		const pending = state.refresh()
		state.reset(0)
		expect(signal?.aborted).toBe(true)
		resolve(10)
		await pending
		expect(get(state)).toBe(0)
		state.cancel()
	})
})

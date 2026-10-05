import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTIFICATION_POLL_MS, startVisiblePolling } from './visible-polling'

class Visibility extends EventTarget {
	hidden = false
	setHidden(hidden: boolean) {
		this.hidden = hidden
		this.dispatchEvent(new Event('visibilitychange'))
	}
}
const settle = async () => {
	await vi.advanceTimersByTimeAsync(0)
}

describe('visible polling', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.useRealTimers()
	})
	it('refreshes immediately and every thirty seconds without a page reload', async () => {
		const refresh = vi.fn(async () => {})
		const stop = startVisiblePolling(refresh, new Visibility())
		await settle()
		expect(refresh).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS - 1)
		expect(refresh).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(1)
		expect(refresh).toHaveBeenCalledTimes(2)
		stop()
	})
	it('pauses while hidden and immediately refreshes when visible', async () => {
		const visibility = new Visibility()
		visibility.hidden = true
		const refresh = vi.fn(async () => {})
		const stop = startVisiblePolling(refresh, visibility)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		expect(refresh).not.toHaveBeenCalled()
		visibility.setHidden(false)
		await settle()
		expect(refresh).toHaveBeenCalledTimes(1)
		visibility.setHidden(true)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		expect(refresh).toHaveBeenCalledTimes(1)
		visibility.setHidden(false)
		await settle()
		expect(refresh).toHaveBeenCalledTimes(2)
		stop()
	})
	it('does not overlap a slow request or visibility change', async () => {
		let resolve: () => void = () => {}
		const refresh = vi.fn(
			() =>
				new Promise<void>((done) => {
					resolve = done
				}),
		)
		const visibility = new Visibility()
		const stop = startVisiblePolling(refresh, visibility)
		await settle()
		visibility.setHidden(true)
		visibility.setHidden(false)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		expect(refresh).toHaveBeenCalledTimes(1)
		resolve()
		await settle()
		expect(refresh).toHaveBeenCalledTimes(2)
		stop()
		resolve()
	})
	it('does not reschedule after an in-flight request ends in a hidden tab', async () => {
		let resolve: () => void = () => {}
		const visibility = new Visibility()
		const refresh = vi.fn(
			() =>
				new Promise<void>((done) => {
					resolve = done
				}),
		)
		const stop = startVisiblePolling(refresh, visibility)
		await settle()
		visibility.setHidden(true)
		resolve()
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		expect(refresh).toHaveBeenCalledTimes(1)
		stop()
	})
	it('retries after a request rejects', async () => {
		const refresh = vi.fn(async () => {
			throw new Error('offline')
		})
		const stop = startVisiblePolling(refresh, new Visibility())
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS)
		expect(refresh).toHaveBeenCalledTimes(2)
		stop()
	})
	it('stops on a terminal authentication result', async () => {
		const visibility = new Visibility()
		const refresh = vi.fn(async () => false)
		const stop = startVisiblePolling(refresh, visibility)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		visibility.setHidden(false)
		await settle()
		expect(refresh).toHaveBeenCalledTimes(1)
		stop()
	})
	it('removes timers and listeners on disposal, even with a pending request', async () => {
		let resolve: () => void = () => {}
		const visibility = new Visibility()
		const refresh = vi.fn(
			() =>
				new Promise<void>((done) => {
					resolve = done
				}),
		)
		const stop = startVisiblePolling(refresh, visibility)
		await settle()
		stop()
		resolve()
		visibility.setHidden(false)
		await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS * 2)
		expect(refresh).toHaveBeenCalledTimes(1)
		expect(vi.getTimerCount()).toBe(0)
	})
})

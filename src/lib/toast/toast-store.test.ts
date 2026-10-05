import { describe, expect, it } from 'vitest'
import { createToastStore, type ToastItem, type ToastTimer } from './toast-store'

class FakeTimer implements ToastTimer {
	private nextHandle = 1
	readonly pending = new Map<number, { callback: () => void; ms: number }>()
	set(callback: () => void, ms: number) {
		const handle = this.nextHandle++
		this.pending.set(handle, { callback, ms })
		return handle
	}
	clear(handle: unknown) {
		this.pending.delete(handle as number)
	}
	fireAll() {
		for (const [handle, { callback }] of [...this.pending]) {
			this.pending.delete(handle)
			callback()
		}
	}
}

function setup(durationMs?: number) {
	const timer = new FakeTimer()
	const store = createToastStore(timer, durationMs)
	let latest: ToastItem[] = []
	store.subscribe((items) => {
		latest = items
	})
	return { timer, store, current: () => latest }
}

describe('toast store', () => {
	it('starts empty for a new subscriber', () => {
		const { current } = setup()
		expect(current()).toEqual([])
	})

	it('adds a toast with a unique id', () => {
		const { store, current } = setup()
		const first = store.show('One')
		const second = store.show('Two')
		expect(first).not.toBe(second)
		expect(current().map((item) => item.message)).toEqual(['One', 'Two'])
	})

	it('auto-dismisses a toast when the timer fires', () => {
		const { store, timer, current } = setup(1500)
		store.show('Gone soon')
		expect([...timer.pending.values()][0].ms).toBe(1500)
		timer.fireAll()
		expect(current()).toEqual([])
	})

	it('dismisses a toast manually and cancels its timer', () => {
		const { store, timer, current } = setup()
		const id = store.show('Manual')
		store.dismiss(id)
		expect(current()).toEqual([])
		expect(timer.pending.size).toBe(0)
	})

	it('keeps other toasts when one is dismissed', () => {
		const { store, current } = setup()
		const first = store.show('Keep')
		store.show('Drop')
		store.dismiss(first + 1)
		expect(current().map((item) => item.message)).toEqual(['Keep'])
	})

	it('ignores dismissing an unknown id', () => {
		const { store, current } = setup()
		store.show('Stay')
		store.dismiss(999)
		expect(current()).toHaveLength(1)
	})

	it('stops notifying after unsubscribe', () => {
		const timer = new FakeTimer()
		const store = createToastStore(timer)
		let calls = 0
		const unsubscribe = store.subscribe(() => {
			calls++
		})
		unsubscribe()
		store.show('Silent')
		expect(calls).toBe(1)
	})
})

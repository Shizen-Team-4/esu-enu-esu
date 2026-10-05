import { writable } from 'svelte/store'

export function createUnreadCount(
	initial: number | null,
	load: (signal: AbortSignal) => Promise<number>,
) {
	const count = writable(initial)
	let controller: AbortController | null = null
	let request: Promise<boolean> | null = null
	let generation = 0
	function cancel() {
		generation++
		controller?.abort()
		controller = null
		request = null
	}
	return {
		subscribe: count.subscribe,
		reset(value: number | null, preservePrevious = false) {
			cancel()
			count.update((previous) => (preservePrevious && value === null ? previous : value))
		},
		refresh(): Promise<boolean> {
			if (request) return request
			const mine = generation
			controller = new AbortController()
			request = load(controller.signal)
				.then((value) => {
					if (mine === generation) count.set(value)
					return true
				})
				.catch((cause: unknown) => (cause as { code?: string } | null)?.code !== 'UNAUTHENTICATED')
				.finally(() => {
					if (mine === generation) request = null
				})
			return request
		},
		cancel,
	}
}

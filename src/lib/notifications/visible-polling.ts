export const NOTIFICATION_POLL_MS = 30_000

type Visibility = Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>
interface Timers {
	setTimeout(callback: () => void, delay: number): unknown
	clearTimeout(id: unknown): void
}

const defaultTimers: Timers = {
	setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
	clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
}

/** One request at a time; only visible tabs poll, with an immediate refresh on return. */
export function startVisiblePolling(
	refresh: () => Promise<boolean | void>,
	visibility: Visibility,
	timers: Timers = defaultTimers,
) {
	let stopped = false
	let running = false
	let returned = false
	let timeout: unknown
	function schedule(keepGoing: boolean | void = true) {
		running = false
		if (keepGoing === false) stopped = true
		if (stopped || visibility.hidden) return
		if (returned) {
			returned = false
			run()
		} else timeout = timers.setTimeout(run, NOTIFICATION_POLL_MS)
	}
	function run() {
		if (stopped || visibility.hidden || running) return
		running = true
		Promise.resolve()
			.then(refresh)
			.then(schedule, () => schedule())
	}
	function onVisibility() {
		timers.clearTimeout(timeout)
		if (visibility.hidden) return
		if (running) returned = true
		else run()
	}
	visibility.addEventListener('visibilitychange', onVisibility)
	run()
	return () => {
		stopped = true
		timers.clearTimeout(timeout)
		visibility.removeEventListener('visibilitychange', onVisibility)
	}
}

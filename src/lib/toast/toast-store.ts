export interface ToastItem {
	id: number
	message: string
}

export interface ToastTimer {
	set(callback: () => void, ms: number): unknown
	clear(handle: unknown): void
}

const browserTimer: ToastTimer = {
	set: (callback, ms) => setTimeout(callback, ms),
	clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export const DEFAULT_TOAST_MS = 4000

export function createToastStore(timer: ToastTimer = browserTimer, durationMs = DEFAULT_TOAST_MS) {
	let items: ToastItem[] = []
	let nextId = 1
	const handles = new Map<number, unknown>()
	const listeners = new Set<(items: ToastItem[]) => void>()
	const emit = () => listeners.forEach((listener) => listener(items))

	function dismiss(id: number) {
		const handle = handles.get(id)
		if (handle !== undefined) timer.clear(handle)
		handles.delete(id)
		items = items.filter((item) => item.id !== id)
		emit()
	}

	function show(message: string): number {
		const id = nextId++
		items = [...items, { id, message }]
		handles.set(
			id,
			timer.set(() => dismiss(id), durationMs),
		)
		emit()
		return id
	}

	function subscribe(listener: (items: ToastItem[]) => void) {
		listeners.add(listener)
		listener(items)
		return () => {
			listeners.delete(listener)
		}
	}

	return { show, dismiss, subscribe }
}

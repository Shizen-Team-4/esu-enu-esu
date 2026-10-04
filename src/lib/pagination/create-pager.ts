import type { Page } from '$lib/contract'

export type PagerStatus = 'idle' | 'loading' | 'error'
export type LoadPage<T> = (cursor: string) => Promise<Page<T>>

export interface Pager<T> {
	readonly items: T[]
	readonly nextCursor: string | null
	readonly status: PagerStatus
	readonly error: unknown
	loadMore(): Promise<void>
	retry(): Promise<void>
	reset(page: Page<T>): void
}

/** Plain pagination state machine: appends pages, dedupes by id, keeps items on error. */
export function createPager<T extends { id: string }>(
	initial: Page<T>,
	load: LoadPage<T>,
	onChange: () => void = () => {},
): Pager<T> {
	let items = [...initial.items]
	let nextCursor = initial.nextCursor
	let status: PagerStatus = 'idle'
	let error: unknown = null
	let generation = 0

	async function loadMore() {
		if (status === 'loading' || nextCursor === null) return
		const mine = generation
		status = 'loading'
		error = null
		onChange()
		try {
			const page = await load(nextCursor)
			if (mine !== generation) return
			const seen = new Set(items.map((item) => item.id))
			items = [...items, ...page.items.filter((item) => !seen.has(item.id))]
			nextCursor = page.nextCursor
			status = 'idle'
		} catch (cause) {
			if (mine !== generation) return
			error = cause
			status = 'error'
		}
		onChange()
	}

	return {
		get items() {
			return items
		},
		get nextCursor() {
			return nextCursor
		},
		get status() {
			return status
		},
		get error() {
			return error
		},
		loadMore,
		retry: loadMore,
		reset(page) {
			generation += 1
			items = [...page.items]
			nextCursor = page.nextCursor
			status = 'idle'
			error = null
			onChange()
		},
	}
}

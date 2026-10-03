import type { Page, Post } from '$lib/contract'

export type PagerStatus = 'idle' | 'loading' | 'error'
export type LoadPage = (cursor: string) => Promise<Page<Post>>

export interface FeedPager {
	readonly items: Post[]
	readonly nextCursor: string | null
	readonly status: PagerStatus
	readonly error: unknown
	loadMore(): Promise<void>
	retry(): Promise<void>
	reset(page: Page<Post>): void
}

/** Plain pagination state machine: appends pages, dedupes by id, keeps items on error. */
export function createFeedPager(
	initial: Page<Post>,
	load: LoadPage,
	onChange: () => void = () => {},
): FeedPager {
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

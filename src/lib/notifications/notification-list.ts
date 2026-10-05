import type { Notification, Page } from '$lib/contract'

export interface NotificationListSnapshot {
	items: Notification[]
	nextCursor: string | null
	loading: boolean
	errorCode: string | null
}

/** Refreshes the loaded depth instead of dropping older pages on each poll. */
export function createNotificationList(
	initial: Page<Notification>,
	load: (cursor: string | null) => Promise<Page<Notification>>,
	onChange: (snapshot: NotificationListSnapshot) => void,
	initialError: string | null = null,
) {
	let snapshot: NotificationListSnapshot = { ...initial, loading: false, errorCode: initialError }
	let baseCursor: string | null = null
	let depth = 1
	let generation = 0
	let active = false
	let failedRefresh = true
	function publish(patch: Partial<NotificationListSnapshot>) {
		snapshot = { ...snapshot, ...patch }
		onChange(snapshot)
	}
	async function request(refresh: boolean) {
		if (active || (!refresh && snapshot.nextCursor === null)) return
		active = true
		const mine = generation
		publish({ loading: true, errorCode: null })
		try {
			let cursor = refresh ? baseCursor : snapshot.nextCursor
			const items: Notification[] = refresh ? [] : [...snapshot.items]
			const seen = new Set(items.map((item) => item.id))
			for (let page = 0; page < (refresh ? depth : 1); page++) {
				const result = await load(cursor)
				if (mine !== generation) return
				for (const item of result.items) {
					if (!seen.has(item.id)) items.push(item)
					seen.add(item.id)
				}
				cursor = result.nextCursor
				if (cursor === null) break
			}
			if (!refresh) depth++
			publish({ items, nextCursor: cursor })
		} catch (cause) {
			if (mine === generation) {
				failedRefresh = refresh
				publish({ errorCode: (cause as { code?: string } | null)?.code ?? 'INTERNAL' })
			}
			return (cause as { code?: string } | null)?.code !== 'UNAUTHENTICATED'
		} finally {
			if (mine === generation) {
				active = false
				publish({ loading: false })
			}
		}
	}
	return {
		get snapshot() {
			return snapshot
		},
		refresh: () => request(true),
		loadMore: () => request(false),
		retry: () => request(failedRefresh),
		reset(page: Page<Notification> | null, cursor: string | null, errorCode: string | null = null) {
			generation++
			active = false
			failedRefresh = true
			if (page === null && cursor === baseCursor) {
				publish({ loading: false, errorCode })
				return
			}
			depth = 1
			baseCursor = cursor
			publish({ ...(page ?? { items: [], nextCursor: null }), loading: false, errorCode })
		},
		dispose() {
			generation++
			active = false
		},
	}
}

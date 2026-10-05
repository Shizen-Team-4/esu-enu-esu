import type { BackHistorySnapshot } from './back-history'

const STORAGE_KEY = 'back-history'
type SnapshotStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readBackSnapshot(storage: () => SnapshotStorage): BackHistorySnapshot | null {
	try {
		const value: unknown = JSON.parse(storage().getItem(STORAGE_KEY) ?? 'null')
		if (
			value !== null &&
			typeof value === 'object' &&
			'href' in value &&
			typeof value.href === 'string' &&
			'backHref' in value &&
			(value.backHref === null || typeof value.backHref === 'string')
		) {
			return { href: value.href, backHref: value.backHref }
		}
	} catch {
		// Browsing still works when session storage is unavailable or contains invalid data.
	}
	return null
}

export function saveBackSnapshot(
	storage: () => SnapshotStorage,
	snapshot: BackHistorySnapshot,
): void {
	try {
		storage().setItem(STORAGE_KEY, JSON.stringify(snapshot))
	} catch {
		// Storage restrictions must not block navigation.
	}
}

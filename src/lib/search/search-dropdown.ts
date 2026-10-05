import { SEARCH_QUERY_MAX } from '$lib/contract/limits'

export function normalizeQuery(raw: string): string | null {
	const trimmed = raw.trim()
	const length = [...trimmed].length
	if (length === 0 || length > SEARCH_QUERY_MAX) return null
	return trimmed
}

export function moveActiveIndex(current: number, delta: number, count: number): number {
	if (count <= 0) return -1
	if (current < 0) return delta > 0 ? 0 : count - 1
	return (((current + delta) % count) + count) % count
}

export function isStale(requestQuery: string, currentQuery: string | null): boolean {
	return requestQuery !== currentQuery
}

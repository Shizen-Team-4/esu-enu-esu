import type { LikeState, SaveState } from './optimistic-toggle'

const asRecord = (data: unknown): Record<string, unknown> | null =>
	typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null

export function likeFromData(data: unknown): LikeState | null {
	const record = asRecord(data)
	if (!record || typeof record.liked !== 'boolean' || typeof record.likes !== 'number') return null
	return { liked: record.liked, likes: record.likes }
}

export function saveFromData(data: unknown): SaveState | null {
	const record = asRecord(data)
	if (!record || typeof record.saved !== 'boolean') return null
	return { saved: record.saved }
}

/** Reads the contract error code from a failed form action's data. */
export function errorCodeFromData(data: unknown): string {
	const error = asRecord(asRecord(data)?.error)
	return typeof error?.code === 'string' ? error.code : 'INTERNAL'
}

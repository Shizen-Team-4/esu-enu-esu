import { AppError } from './app-error'

export interface Cursor {
	time: number
	id: string
}

export function encodeCursor(cursor: Cursor): string {
	return btoa(`${cursor.time}:${cursor.id}`)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')
}

export function decodeCursor(value: string): Cursor {
	try {
		if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 256) throw new Error()
		const decoded = atob(value.replaceAll('-', '+').replaceAll('_', '/'))
		const match = /^(\d+):([A-Za-z0-9_-]+)$/.exec(decoded)
		if (!match) throw new Error()
		const time = Number(match[1])
		const cursor = { time, id: match[2] }
		if (!Number.isSafeInteger(time) || encodeCursor(cursor) !== value) throw new Error()
		return cursor
	} catch {
		throw new AppError('VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
	}
}

export function parseLimit(value: unknown = 20): number {
	const limit =
		typeof value === 'number'
			? value
			: typeof value === 'string' && /^\d+$/.test(value)
				? Number(value)
				: NaN
	if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
		throw new AppError('VALIDATION_FAILED', { limit: 'INVALID_FORMAT' })
	}
	return limit
}

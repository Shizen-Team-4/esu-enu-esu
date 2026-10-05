import type { ErrorCode } from '$lib/contract'

export type { ErrorCode }

export class AppError extends Error {
	constructor(
		public readonly code: ErrorCode,
		public readonly fields?: Record<string, string>,
		public readonly retryAfterSec?: number,
	) {
		super(code)
	}
}

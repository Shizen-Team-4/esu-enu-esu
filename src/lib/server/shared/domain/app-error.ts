export type ErrorCode =
	| 'VALIDATION_FAILED'
	| 'UNAUTHENTICATED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'RATE_LIMITED'
	| 'INTERNAL'
	| 'PAYLOAD_TOO_LARGE'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'INVALID_CREDENTIALS'
	| 'EMAIL_NOT_VERIFIED'

export class AppError extends Error {
	constructor(
		public readonly code: ErrorCode,
		public readonly fields?: Record<string, string>,
		public readonly retryAfterSec?: number,
	) {
		super(code)
	}
}

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

export interface ErrorEnvelope {
	error: {
		code: ErrorCode
		message: string
		fields?: Record<string, string>
		retryAfterSec?: number
	}
}

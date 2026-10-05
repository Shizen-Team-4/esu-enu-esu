export type ErrorCode =
	| 'VALIDATION_FAILED'
	| 'UNAUTHENTICATED'
	| 'INVALID_CREDENTIALS'
	| 'FORBIDDEN'
	| 'EMAIL_NOT_VERIFIED'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'PAYLOAD_TOO_LARGE'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'RATE_LIMITED'
	| 'INTERNAL'

export type FieldErrorCode =
	'REQUIRED' | 'TOO_SHORT' | 'TOO_LONG' | 'TOO_MANY' | 'INVALID_FORMAT' | 'NOT_ALLOWED' | 'TAKEN'

export interface ErrorEnvelope {
	error: {
		code: ErrorCode
		/** English text for developers and logs; never shown to users */
		message: string
		/** only for VALIDATION_FAILED and CONFLICT */
		fields?: Record<string, FieldErrorCode>
		/** only for RATE_LIMITED */
		retryAfterSec?: number
	}
}

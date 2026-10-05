import type { ErrorCode, ErrorEnvelope } from '$lib/contract'
import { AppError } from '../domain/app-error'

const statuses: Record<ErrorCode, number> = {
	VALIDATION_FAILED: 400,
	UNAUTHENTICATED: 401,
	INVALID_CREDENTIALS: 401,
	FORBIDDEN: 403,
	EMAIL_NOT_VERIFIED: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	RATE_LIMITED: 429,
	INTERNAL: 500,
}

export const statusOf = (code: ErrorCode): number => statuses[code]

export function toEnvelope(cause: unknown): ErrorEnvelope {
	if (!(cause instanceof AppError)) {
		return { error: { code: 'INTERNAL', message: 'Internal server error' } }
	}
	return {
		error: {
			code: cause.code,
			message: cause.message,
			...(cause.fields ? { fields: cause.fields } : {}),
			...(cause.retryAfterSec === undefined ? {} : { retryAfterSec: cause.retryAfterSec }),
		},
	}
}

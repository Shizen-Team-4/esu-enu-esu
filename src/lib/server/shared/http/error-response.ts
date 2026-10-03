import { json } from '@sveltejs/kit'
import { AppError, type ErrorCode } from '../domain/app-error'

const statuses: Record<ErrorCode, number> = {
	VALIDATION_FAILED: 400,
	UNAUTHENTICATED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	RATE_LIMITED: 429,
	INTERNAL: 500,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	INVALID_CREDENTIALS: 401,
	EMAIL_NOT_VERIFIED: 403,
}

export function errorResponse(cause: unknown) {
	const error = cause instanceof AppError ? cause : new AppError('INTERNAL')
	return json(
		{
			error: {
				code: error.code,
				message: error.message,
				...(error.fields ? { fields: error.fields } : {}),
			},
		},
		{
			status: statuses[error.code],
		},
	)
}

import type { ErrorCode } from '$lib/contract'

const ERROR_CODES = [
	'VALIDATION_FAILED',
	'UNAUTHENTICATED',
	'FORBIDDEN',
	'NOT_FOUND',
	'CONFLICT',
	'RATE_LIMITED',
	'INTERNAL',
	'PAYLOAD_TOO_LARGE',
	'UNSUPPORTED_MEDIA_TYPE',
	'INVALID_CREDENTIALS',
	'EMAIL_NOT_VERIFIED',
] as const satisfies readonly ErrorCode[]

const CLIENT_ERROR_CODES = ['UPLOAD_EXPIRED'] as const

const FIELD_CODES = [
	'REQUIRED',
	'TOO_SHORT',
	'TOO_LONG',
	'TOO_MANY',
	'INVALID_FORMAT',
	'NOT_ALLOWED',
	'TAKEN',
] as const

const knownErrors: readonly string[] = [...ERROR_CODES, ...CLIENT_ERROR_CODES]
const knownFields: readonly string[] = FIELD_CODES

export type ClientErrorCode = ErrorCode | (typeof CLIENT_ERROR_CODES)[number]

export function errorMessageKey(code: string | null | undefined): string {
	return code && knownErrors.includes(code) ? `error.${code}` : 'error.INTERNAL'
}

export function fieldErrorKey(fieldCode: string): string {
	return knownFields.includes(fieldCode) ? `error.field.${fieldCode}` : 'error.field.INVALID_FORMAT'
}

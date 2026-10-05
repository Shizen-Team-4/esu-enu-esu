import type { ErrorCode, FieldErrorCode } from '$lib/types/error'

/** Failure that comes from the network layer, not from the error envelope. */
export type RetryableFailure = ErrorCode | 'NETWORK'

export const errorMessageKey = (code: ErrorCode): string => `error.${code}`

export const fieldErrorKey = (code: FieldErrorCode): string => `error.field.${code}`

/** Contract 2.4: only internal and network failures show a retry button. */
export const isRetryable = (code: RetryableFailure): boolean =>
	code === 'INTERNAL' || code === 'NETWORK'

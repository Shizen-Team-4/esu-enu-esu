import { describe, expect, it } from 'vitest'
import { errorMessageKey, fieldErrorKey, isRetryable } from './error-display'

describe('errorMessageKey', () => {
	it('prefixes the code with error.', () => {
		expect(errorMessageKey('VALIDATION_FAILED')).toBe('error.VALIDATION_FAILED')
	})
})

describe('fieldErrorKey', () => {
	it('prefixes the code with field.', () => {
		expect(fieldErrorKey('TOO_LONG')).toBe('field.TOO_LONG')
	})
})

describe('isRetryable', () => {
	it('is true for INTERNAL', () => {
		expect(isRetryable('INTERNAL')).toBe(true)
	})

	it('is true for network failures', () => {
		expect(isRetryable('NETWORK')).toBe(true)
	})

	it.each(['NOT_FOUND', 'FORBIDDEN', 'RATE_LIMITED', 'VALIDATION_FAILED'] as const)(
		'is false for %s',
		(code) => {
			expect(isRetryable(code)).toBe(false)
		},
	)
})

import { describe, expect, it } from 'vitest'
import { errorMessageKey, fieldErrorKey } from './error-message'

describe('errorMessageKey', () => {
	it('maps a contract code to its key', () => {
		expect(errorMessageKey('PAYLOAD_TOO_LARGE')).toBe('error.PAYLOAD_TOO_LARGE')
	})

	it('maps the client-only upload code', () => {
		expect(errorMessageKey('UPLOAD_EXPIRED')).toBe('error.UPLOAD_EXPIRED')
	})

	it.each([undefined, null, '', 'WHATEVER'])('falls back to INTERNAL for %s', (code) => {
		expect(errorMessageKey(code)).toBe('error.INTERNAL')
	})
})

describe('fieldErrorKey', () => {
	it('maps a known field code', () => {
		expect(fieldErrorKey('TAKEN')).toBe('error.field.TAKEN')
	})

	it('falls back to INVALID_FORMAT for unknown codes', () => {
		expect(fieldErrorKey('NOPE')).toBe('error.field.INVALID_FORMAT')
	})
})

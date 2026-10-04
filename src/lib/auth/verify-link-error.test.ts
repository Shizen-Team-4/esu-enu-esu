import { describe, expect, it } from 'vitest'
import { verifyLinkErrorKey } from './verify-link-error'

describe('verifyLinkErrorKey', () => {
	it.each(['invalid_token', 'token_expired'])('returns the invalid-link key for %s', (code) => {
		expect(verifyLinkErrorKey(code)).toBe('auth.verifyLinkInvalid')
	})

	it('returns null when there is no error', () => {
		expect(verifyLinkErrorKey(null)).toBeNull()
	})

	it('returns null for an unknown error', () => {
		expect(verifyLinkErrorKey('something_else')).toBeNull()
	})
})

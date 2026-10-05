import { describe, expect, it } from 'vitest'
import { googleSignInErrorKey } from './google-sign-in-error'

describe('googleSignInErrorKey', () => {
	it('maps account_not_linked to the not-linked key', () => {
		expect(googleSignInErrorKey('account_not_linked')).toBe('auth.googleAccountNotLinked')
	})

	it('returns null when there is no error', () => {
		expect(googleSignInErrorKey(null)).toBeNull()
	})

	it('returns null for an unknown error', () => {
		expect(googleSignInErrorKey('something_else')).toBeNull()
	})

	it('returns null for an invalid-link error', () => {
		expect(googleSignInErrorKey('invalid_token')).toBeNull()
	})
})

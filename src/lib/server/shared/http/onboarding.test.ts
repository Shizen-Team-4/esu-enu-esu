import { describe, expect, it } from 'vitest'
import { isOnboardingExempt, needsOnboarding } from './onboarding'

describe('needsOnboarding', () => {
	it.each([null, undefined, ''])('redirects a user whose username is %j', (username) => {
		expect(needsOnboarding({ username }, '/dashboard')).toBe(true)
		expect(needsOnboarding({}, '/')).toBe(true)
	})

	it('lets a user with a username through', () => {
		expect(needsOnboarding({ username: 'alice' }, '/dashboard')).toBe(false)
	})

	it('ignores logged-out visitors', () => {
		expect(needsOnboarding(null, '/dashboard')).toBe(false)
	})

	it('does not redirect on exempt paths', () => {
		expect(needsOnboarding({ username: null }, '/onboard')).toBe(false)
	})
})

// cspell:ignore apix
describe('isOnboardingExempt', () => {
	it.each([
		'/onboard',
		'/api/feed',
		'/api/auth/sign-out',
		'/auth/google',
		'/logout',
		'/media/a/b.png',
		'/_app/immutable/x',
		'/favicon.ico',
		'/robots.txt',
	])('exempts %s', (path) => expect(isOnboardingExempt(path)).toBe(true))

	it.each(['/', '/dashboard', '/u/alice', '/onboarding', '/apix', '/settings'])(
		'does not exempt %s',
		(path) => expect(isOnboardingExempt(path)).toBe(false),
	)
})

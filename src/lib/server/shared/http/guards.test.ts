import { describe, expect, it } from 'vitest'
import type { Services } from '../../container'
import { requireApiServices, requireServices, requireUser } from './guards'

const base = { lang: 'en', theme: 'system', user: null, session: null, preferences: null }
const locals = (overrides: object) => ({ ...base, ...overrides }) as unknown as App.Locals

function thrownBy(fn: () => unknown): { status: number; location?: string } {
	try {
		fn()
	} catch (thrown) {
		return thrown as { status: number; location?: string }
	}
	throw new Error('did not throw')
}

describe('requireUser', () => {
	it('returns the signed-in user', () => {
		const user = { id: 'usr_1' }
		expect(requireUser(locals({ user }))).toBe(user)
	})
	it('redirects guests to /login', () => {
		const result = thrownBy(() => requireUser(locals({})))
		expect(result.status).toBe(303)
		expect(result.location).toBe('/login')
	})
})

describe('requireServices', () => {
	it('returns the services', () => {
		const services = {} as Services
		expect(requireServices(locals({ services }))).toBe(services)
	})
	it('responds 503 when services are missing', () => {
		expect(thrownBy(() => requireServices(locals({}))).status).toBe(503)
	})
})

describe('requireApiServices', () => {
	it('returns the services', () => {
		const services = {} as Services
		expect(requireApiServices(locals({ services }))).toBe(services)
	})
	it('throws an INTERNAL AppError when services are missing', () => {
		expect(() => requireApiServices(locals({}))).toThrow(
			expect.objectContaining({ code: 'INTERNAL' }),
		)
	})
})

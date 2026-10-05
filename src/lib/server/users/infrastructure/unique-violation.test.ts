import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from './unique-violation'

describe('isUniqueViolation', () => {
	it('detects a UNIQUE constraint error', () => {
		expect(isUniqueViolation(new Error('UNIQUE constraint failed: user.username'))).toBe(true)
	})

	it('detects it in the cause of a wrapping error', () => {
		const wrapped = new Error('Failed query', {
			cause: new Error('D1_ERROR: UNIQUE constraint failed: user.username'),
		})

		expect(isUniqueViolation(wrapped)).toBe(true)
	})

	it.each([new Error('boom'), 'text', null, undefined])('ignores %j', (cause) => {
		expect(isUniqueViolation(cause)).toBe(false)
	})
})

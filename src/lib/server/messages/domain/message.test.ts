import { describe, it, expect } from 'vitest'
import { messageBody, messageId, messageSequence } from './message'
describe('message validation', () => {
	it.each([null, undefined, 1, '', '   '])('rejects empty or invalid text %s', (value) =>
		expect(() => messageBody(value)).toThrow(),
	)
	it('counts Unicode characters and trims content', () => {
		expect(messageBody(' \u{1f600} ')).toBe('\u{1f600}')
		expect(messageBody('\u{1f600}'.repeat(2000))).toHaveLength(4000)
		expect(() => messageBody('\u{1f600}'.repeat(2001))).toThrow()
	})
	it('validates ids by their expected type', () => {
		expect(messageId('dm_a', 'dm')).toBe('dm_a')
		for (const value of ['usr_a', 'dm_', null, 'dm_a/../b', 'dm_' + 'a'.repeat(101)])
			expect(() => messageId(value, 'dm')).toThrow()
	})
	it('accepts only positive safe integer sequences', () => {
		expect(messageSequence(1)).toBe(1)
		expect(messageSequence('42')).toBe(42)
		for (const value of [0, -1, 0.5, NaN, Infinity, null, '1.5', '', Number.MAX_SAFE_INTEGER + 1])
			expect(() => messageSequence(value)).toThrow()
	})
})

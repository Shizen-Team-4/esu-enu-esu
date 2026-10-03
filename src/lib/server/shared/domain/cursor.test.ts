import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor, parseLimit } from './cursor'

describe('cursor pagination', () => {
	it('round trips the timestamp and identifier', () => {
		const cursor = { time: 1790985600000, id: 'pst_example' }
		expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
	})
	it.each([
		'',
		'%',
		'abc=',
		btoa('-1:pst_a'),
		btoa('1:'),
		btoa('9007199254740992:pst_a'),
		'x'.repeat(257),
	])('rejects invalid cursor %s', (value) => {
		expect(() => decodeCursor(value)).toThrow('VALIDATION_FAILED')
	})
	it.each([0, 51, 1.5, 'abc', '', null, {}, '-1'])('rejects invalid limit %j', (value) => {
		expect(() => parseLimit(value)).toThrow('VALIDATION_FAILED')
	})
	it('accepts boundary values and defaults', () => {
		expect(parseLimit()).toBe(20)
		expect(parseLimit('1')).toBe(1)
		expect(parseLimit(50)).toBe(50)
	})
})

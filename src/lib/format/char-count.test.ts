import { describe, expect, it } from 'vitest'
import { charCount, isOver, remaining } from './char-count'

describe('charCount', () => {
	it('returns 0 for an empty string', () => {
		expect(charCount('')).toBe(0)
	})
	it('counts ascii characters', () => {
		expect(charCount('hello')).toBe(5)
	})
	it('counts a surrogate pair emoji as one character', () => {
		expect(charCount('a😀b')).toBe(3)
	})
})

describe('remaining', () => {
	it('returns the characters left', () => {
		expect(remaining('abc', 10)).toBe(7)
	})
	it('returns 0 when exactly at the limit', () => {
		expect(remaining('abc', 3)).toBe(0)
	})
	it('returns a negative number when over the limit', () => {
		expect(remaining('abcd', 3)).toBe(-1)
	})
})

describe('isOver', () => {
	it('is false when exactly at the limit', () => {
		expect(isOver('abc', 3)).toBe(false)
	})
	it('is true when over the limit', () => {
		expect(isOver('abcd', 3)).toBe(true)
	})
	it('counts emoji as single characters', () => {
		expect(isOver('😀😀', 2)).toBe(false)
	})
})

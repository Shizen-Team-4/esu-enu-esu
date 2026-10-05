import { describe, expect, it } from 'vitest'
import { isLongCaption, LONG_CAPTION_CHARS } from './caption'

describe('isLongCaption', () => {
	it('is false for an empty caption', () => expect(isLongCaption('')).toBe(false))
	it('is false at the limit', () => {
		expect(isLongCaption('a'.repeat(LONG_CAPTION_CHARS))).toBe(false)
	})
	it('is true above the limit', () => {
		expect(isLongCaption('a'.repeat(LONG_CAPTION_CHARS + 1))).toBe(true)
	})
})

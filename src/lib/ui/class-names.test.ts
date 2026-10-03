import { describe, expect, it } from 'vitest'
import { cn } from './class-names'

describe('cn', () => {
	it('joins class strings with a space', () => {
		expect(cn('a', 'b')).toBe('a b')
	})

	it('drops false, null, undefined and empty values', () => {
		expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
	})

	it('returns an empty string when nothing is truthy', () => {
		expect(cn(false, undefined)).toBe('')
	})
})

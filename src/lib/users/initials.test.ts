import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
	it('uses one letter for a single word', () => {
		expect(initials('Dara')).toBe('D')
	})

	it('uses the first letters of the first two words', () => {
		expect(initials('Mei Kobayashi')).toBe('MK')
		expect(initials('mei kobayashi extra')).toBe('MK')
	})

	it('ignores extra whitespace', () => {
		expect(initials('  sokha   travel ')).toBe('ST')
	})

	it('keeps a whole character for non-latin scripts', () => {
		expect(initials('\u5C0F\u6797 \u7F8E')).toBe('\u5C0F\u7F8E')
	})

	it('returns ? for an empty name', () => {
		expect(initials('   ')).toBe('?')
	})
})

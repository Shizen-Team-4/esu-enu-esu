import { describe, expect, it } from 'vitest'
import { formatDuration } from './format-duration'

describe('formatDuration', () => {
	it('formats zero', () => expect(formatDuration(0)).toBe('0:00'))
	it('formats seconds', () => expect(formatDuration(7)).toBe('0:07'))
	it('formats minutes and seconds', () => expect(formatDuration(125)).toBe('2:05'))
	it('drops fractions', () => expect(formatDuration(59.9)).toBe('0:59'))
	it('formats hours', () => expect(formatDuration(3725)).toBe('1:02:05'))
	it('shows 0:00 for NaN', () => expect(formatDuration(Number.NaN)).toBe('0:00'))
	it('shows 0:00 for a negative value', () => expect(formatDuration(-5)).toBe('0:00'))
})

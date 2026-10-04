import { describe, expect, it } from 'vitest'
import { relativeTime } from './relative-time'

const now = new Date('2026-05-10T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()
const minute = 60_000
const hour = 60 * minute
const day = 24 * hour

describe('relativeTime', () => {
	it('says now for under a minute', () => {
		expect(relativeTime(ago(5_000), now, 'en')).toBe('now')
	})
	it('formats minutes', () => {
		expect(relativeTime(ago(5 * minute), now, 'en')).toMatch(/^5\s?m/)
	})
	it('formats hours', () => {
		expect(relativeTime(ago(3 * hour), now, 'en')).toMatch(/^3\s?h/)
	})
	it('formats days', () => {
		expect(relativeTime(ago(2 * day), now, 'en')).toMatch(/^2\s?d/)
	})
	it('falls back to a short date after a week', () => {
		expect(relativeTime(ago(30 * day), now, 'en')).toBe('Apr 10, 2026')
	})
	it('respects the locale', () => {
		expect(relativeTime(ago(30 * day), now, 'ja')).toBe('2026/04/10')
	})
	it('treats a future timestamp as now', () => {
		expect(relativeTime(ago(-minute), now, 'en')).toBe('now')
	})
})

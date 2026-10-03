import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './format-relative-time'

const now = new Date('2026-10-02T12:00:00.000Z')
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString()

describe('formatRelativeTime', () => {
	it('says "now" for the same moment', () => {
		expect(formatRelativeTime(now.toISOString(), now, 'en')).toBe('now')
	})

	it('treats a time in the future as now', () => {
		expect(formatRelativeTime(ago(-500), now, 'en')).toBe('now')
	})

	it('uses seconds', () => expect(formatRelativeTime(ago(30), now, 'en')).toBe('30 seconds ago'))
	it('uses minutes', () => expect(formatRelativeTime(ago(5 * 60), now, 'en')).toBe('5 minutes ago'))
	it('uses hours', () => expect(formatRelativeTime(ago(3 * 3600), now, 'en')).toBe('3 hours ago'))
	it('uses days', () => expect(formatRelativeTime(ago(2 * 86400), now, 'en')).toBe('2 days ago'))
	it('uses weeks', () => expect(formatRelativeTime(ago(14 * 86400), now, 'en')).toBe('2 weeks ago'))
	it('uses months', () => {
		expect(formatRelativeTime(ago(90 * 86400), now, 'en')).toBe('3 months ago')
	})
	it('uses years', () => {
		expect(formatRelativeTime(ago(800 * 86400), now, 'en')).toBe('2 years ago')
	})
	it('follows the locale', () => {
		expect(formatRelativeTime(ago(3 * 3600), now, 'ja')).toBe('3 時間前')
	})
})

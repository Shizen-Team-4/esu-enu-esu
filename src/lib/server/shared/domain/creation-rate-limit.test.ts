import { describe, expect, it } from 'vitest'
import { retryAfterSec } from './creation-rate-limit'

const now = new Date('2026-10-03T12:00:00Z')

describe('retryAfterSec', () => {
	it('returns the whole window when there is no oldest post', () => {
		expect(retryAfterSec(null, now)).toBe(3600)
	})
	it('returns the time until the oldest post leaves the window', () => {
		expect(retryAfterSec(new Date('2026-10-03T11:30:00Z'), now)).toBe(1800)
	})
	it('rounds partial seconds up', () => {
		expect(retryAfterSec(new Date('2026-10-03T11:00:00.500Z'), now)).toBe(1)
	})
	it('never returns less than 1', () => {
		expect(retryAfterSec(new Date('2026-10-03T10:00:00Z'), now)).toBe(1)
	})
})

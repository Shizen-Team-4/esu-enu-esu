import { describe, expect, it } from 'vitest'
import { isStale, MAX_QUERY_LENGTH, moveActiveIndex, normalizeQuery } from './search-dropdown'

describe('normalizeQuery', () => {
	it('returns null for an empty string', () => {
		expect(normalizeQuery('')).toBeNull()
	})

	it('returns null for whitespace only', () => {
		expect(normalizeQuery('   \t\n')).toBeNull()
	})

	it('trims surrounding whitespace', () => {
		expect(normalizeQuery('  alice  ')).toBe('alice')
	})

	it('accepts exactly 50 characters', () => {
		const q = 'a'.repeat(MAX_QUERY_LENGTH)
		expect(normalizeQuery(q)).toBe(q)
	})

	it('rejects 51 characters', () => {
		expect(normalizeQuery('a'.repeat(MAX_QUERY_LENGTH + 1))).toBeNull()
	})

	it('counts 50 emoji as valid', () => {
		const q = '😀'.repeat(50)
		expect(normalizeQuery(q)).toBe(q)
	})

	it('rejects 51 emoji', () => {
		expect(normalizeQuery('😀'.repeat(51))).toBeNull()
	})

	it('counts 50 Khmer characters as valid', () => {
		const q = 'ក'.repeat(50)
		expect(normalizeQuery(q)).toBe(q)
	})

	it('does not count trimmed whitespace toward the limit', () => {
		const q = 'a'.repeat(50)
		expect(normalizeQuery(`  ${q}  `)).toBe(q)
	})
})

describe('moveActiveIndex', () => {
	it('returns -1 when there are no items', () => {
		expect(moveActiveIndex(0, 1, 0)).toBe(-1)
		expect(moveActiveIndex(-1, -1, 0)).toBe(-1)
	})

	it('goes to the first item when moving down from -1', () => {
		expect(moveActiveIndex(-1, 1, 3)).toBe(0)
	})

	it('goes to the last item when moving up from -1', () => {
		expect(moveActiveIndex(-1, -1, 3)).toBe(2)
	})

	it('moves down within range', () => {
		expect(moveActiveIndex(0, 1, 3)).toBe(1)
	})

	it('moves up within range', () => {
		expect(moveActiveIndex(2, -1, 3)).toBe(1)
	})

	it('wraps from the last item to the first when moving down', () => {
		expect(moveActiveIndex(2, 1, 3)).toBe(0)
	})

	it('wraps from the first item to the last when moving up', () => {
		expect(moveActiveIndex(0, -1, 3)).toBe(2)
	})
})

describe('isStale', () => {
	it('is fresh when the queries match', () => {
		expect(isStale('alice', 'alice')).toBe(false)
	})

	it('is stale when the current query differs', () => {
		expect(isStale('ali', 'alice')).toBe(true)
	})

	it('is stale when the current query was cleared', () => {
		expect(isStale('alice', null)).toBe(true)
	})
})

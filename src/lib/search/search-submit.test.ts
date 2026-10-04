import { describe, expect, it } from 'vitest'
import { SEARCH_QUERY_MAX } from '$lib/contract/limits'
import { searchSubmitAction } from './search-submit'

describe('searchSubmitAction', () => {
	it('searches in place when no result is explicitly selected', () => {
		expect(searchSubmitAction(' alice ', undefined)).toEqual({ type: 'search', query: 'alice' })
	})

	it('opens an explicitly selected profile', () => {
		expect(searchSubmitAction('alice', 'alice')).toEqual({ type: 'profile', username: 'alice' })
	})

	it('does nothing for an empty query', () => {
		expect(searchSubmitAction('   ', undefined)).toEqual({ type: 'none' })
	})

	it('does nothing for an oversized query even with a selected profile', () => {
		expect(searchSubmitAction('a'.repeat(SEARCH_QUERY_MAX + 1), 'alice')).toEqual({
			type: 'none',
		})
	})
})

import { describe, expect, it } from 'vitest'
import { counterValues, hasNext, hasPrevious, nextIndex, previousIndex } from './carousel-index'

describe('carousel index', () => {
	it('advances without wrapping past the last item', () => {
		expect(nextIndex(0, 3)).toBe(1)
		expect(nextIndex(2, 3)).toBe(2)
	})
	it('stays at zero for an empty carousel', () => {
		expect(nextIndex(0, 0)).toBe(0)
	})
	it('goes back without wrapping before the first item', () => {
		expect(previousIndex(2)).toBe(1)
		expect(previousIndex(0)).toBe(0)
	})
	it('reports whether adjacent items exist', () => {
		expect(hasNext(1, 3)).toBe(true)
		expect(hasNext(2, 3)).toBe(false)
		expect(hasPrevious(1)).toBe(true)
		expect(hasPrevious(0)).toBe(false)
	})
	it('counts from one', () => {
		expect(counterValues(1, 5)).toEqual({ current: 2, total: 5 })
	})
})

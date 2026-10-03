import { describe, expect, it } from 'vitest'
import { nextIndex, prevIndex, swipeDirection } from './gallery-index'

describe('nextIndex', () => {
	it('moves forward', () => expect(nextIndex(0, 10)).toBe(1))
	it('stops at the last item', () => expect(nextIndex(9, 10)).toBe(9))
	it('stays at 0 for an empty list', () => expect(nextIndex(0, 0)).toBe(0))
})

describe('prevIndex', () => {
	it('moves back', () => expect(prevIndex(3)).toBe(2))
	it('stops at the first item', () => expect(prevIndex(0)).toBe(0))
})

describe('swipeDirection', () => {
	it('swipe left shows the next item', () => expect(swipeDirection(-80, 5, 50)).toBe('next'))
	it('swipe right shows the previous item', () => expect(swipeDirection(80, -5, 50)).toBe('prev'))
	it('ignores a short movement', () => expect(swipeDirection(-49, 0, 50)).toBeNull())
	it('accepts a movement exactly at the threshold', () => {
		expect(swipeDirection(-50, 0, 50)).toBe('next')
	})
	it('ignores a vertical scroll', () => expect(swipeDirection(-60, 120, 50)).toBeNull())
	it('ignores a diagonal movement of equal size', () => {
		expect(swipeDirection(-60, 60, 50)).toBeNull()
	})
})

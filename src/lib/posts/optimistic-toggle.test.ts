import { describe, expect, it } from 'vitest'
import { reconcileLike, reconcileSave, revert, toggleLike, toggleSave } from './optimistic-toggle'

describe('toggleLike', () => {
	it('likes and increments the count', () => {
		expect(toggleLike({ liked: false, likes: 2 })).toEqual({ liked: true, likes: 3 })
	})
	it('removes the like and decrements the count', () => {
		expect(toggleLike({ liked: true, likes: 2 })).toEqual({ liked: false, likes: 1 })
	})
	it('never goes below zero', () => {
		expect(toggleLike({ liked: true, likes: 0 })).toEqual({ liked: false, likes: 0 })
	})
	it('does not mutate the input', () => {
		const state = { liked: false, likes: 1 }
		toggleLike(state)
		expect(state).toEqual({ liked: false, likes: 1 })
	})
})

describe('reconcileLike', () => {
	it('adopts the server result', () => {
		expect(reconcileLike({ liked: true, likes: 5 }, { liked: true, likes: 7 })).toEqual({
			liked: true,
			likes: 7,
		})
	})
})

describe('save', () => {
	it('toggles the saved flag', () => {
		expect(toggleSave({ saved: false })).toEqual({ saved: true })
		expect(toggleSave({ saved: true })).toEqual({ saved: false })
	})
	it('adopts the server result', () => {
		expect(reconcileSave({ saved: true }, { saved: false })).toEqual({ saved: false })
	})
})

describe('revert', () => {
	it('restores the snapshot as a copy', () => {
		const snapshot = { liked: false, likes: 1 }
		const restored = revert(snapshot)
		expect(restored).toEqual(snapshot)
		expect(restored).not.toBe(snapshot)
	})
})

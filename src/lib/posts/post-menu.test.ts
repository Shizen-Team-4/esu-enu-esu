import { describe, expect, it } from 'vitest'
import { postMenuActions } from './post-menu'

const viewer = (isAuthor: boolean) => ({ viewer: { liked: false, saved: false, isAuthor } })

describe('postMenuActions', () => {
	it('offers edit and delete to the author', () => {
		expect(postMenuActions(viewer(true))).toEqual(['edit', 'delete'])
	})

	it('offers only report to other users', () => {
		expect(postMenuActions(viewer(false))).toEqual(['report'])
	})
})

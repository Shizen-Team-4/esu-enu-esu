import { describe, expect, it } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import { postLayout } from './post-layout'

const byId = (id: string) => mockPosts.find((post) => post.id === id)!

describe('postLayout', () => {
	it('uses the text layout for a post without media', () => {
		expect(postLayout(byId('pst_101'))).toBe('text')
	})

	it('uses the single layout for one image', () => {
		expect(postLayout(byId('pst_107'))).toBe('single')
	})

	it('uses the single layout for one wide video in a post', () => {
		expect(postLayout(byId('pst_104'))).toBe('single')
	})

	it('uses the gallery layout for several items', () => {
		expect(postLayout(byId('pst_103'))).toBe('gallery')
	})

	it('uses the reel layout for a wide reel', () => {
		expect(postLayout(byId('pst_106'))).toBe('reel')
	})

	it('uses the reel layout for a 9:16 reel', () => {
		expect(postLayout(byId('pst_105'))).toBe('reel')
	})
})

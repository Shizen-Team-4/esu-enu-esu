import { describe, expect, it } from 'vitest'
import { mockErrors } from './errors'
import { mockPosts } from './posts'
import { mockUsers } from './users'

describe('mock data', () => {
	it('exposes posts with the required keys', () => {
		expect(mockPosts.length).toBeGreaterThan(0)
		for (const post of mockPosts) {
			expect(post).toHaveProperty('id')
			expect(['post', 'reel']).toContain(post.type)
			expect(post.author).toHaveProperty('username')
			expect(Array.isArray(post.media)).toBe(true)
			expect(post.counts).toHaveProperty('likes')
			expect(post.viewer).toHaveProperty('isAuthor')
			expect(post).toHaveProperty('shareUrl')
		}
	})

	it('exposes users with the required keys', () => {
		expect(mockUsers.length).toBeGreaterThan(0)
		for (const user of mockUsers) {
			expect(user).toHaveProperty('id')
			expect(user).toHaveProperty('displayName')
			expect(user).toHaveProperty('avatarUrl')
		}
	})

	it('exposes one error envelope for each of the 11 codes', () => {
		const codes = Object.keys(mockErrors)
		expect(codes).toHaveLength(11)
		for (const code of codes) {
			expect(mockErrors[code as keyof typeof mockErrors].error.code).toBe(code)
		}
	})
})

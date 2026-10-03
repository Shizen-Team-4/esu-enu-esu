import { describe, expect, it } from 'vitest'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { listReels } from './list-reels'

describe('listReels', () => {
	it('returns only reels', async () => {
		const posts = new InMemoryPostRepository({
			posts: [aPost({ id: 'pst_1' }), aPost({ id: 'pst_2', type: 'reel' })],
		})
		const page = await listReels(posts)(null)
		expect(page.items.map((post) => post.id)).toEqual(['pst_2'])
	})

	it('pages with limit and cursor', async () => {
		const posts = new InMemoryPostRepository({
			posts: [aPost({ id: 'pst_1', type: 'reel' }), aPost({ id: 'pst_2', type: 'reel' })],
		})
		const first = await listReels(posts)(null, { limit: 1 })
		const second = await listReels(posts)(null, { limit: 1, cursor: first.nextCursor ?? '' })
		expect([first.items[0].id, second.items[0].id]).toEqual(['pst_2', 'pst_1'])
		expect(second.nextCursor).toBe(null)
	})
})

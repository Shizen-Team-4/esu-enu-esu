import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { listSavedPosts } from './list-saved-posts'

const posts = () =>
	new InMemoryPostRepository({
		posts: [aPost({ id: 'pst_1' }), aPost({ id: 'pst_2' }), aPost({ id: 'pst_3' })],
		saves: [
			['pst_1', 'usr_1', 200],
			['pst_2', 'usr_1', 100],
			['pst_3', 'usr_2', 300],
		],
	})

describe('listSavedPosts', () => {
	it('requires a viewer', async () => {
		await expect(listSavedPosts(posts())(null)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})

	it('returns only the viewer’s saved posts, newest saved first', async () => {
		const page = await listSavedPosts(posts())(viewer)
		expect(page.items.map((post) => post.id)).toEqual(['pst_1', 'pst_2'])
		expect(page.items.every((post) => post.viewer.saved)).toBe(true)
	})
})

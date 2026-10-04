import { describe, expect, it } from 'vitest'
import { otherViewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { getPost } from './get-post'

describe('getPost', () => {
	it('allows public reads', async () => {
		const posts = new InMemoryPostRepository({ posts: [aPost()] })
		expect((await getPost(posts)(null, 'pst_1')).caption).toBe('Hello')
	})

	it('reports viewer flags for a signed-in reader', async () => {
		const posts = new InMemoryPostRepository({ posts: [aPost()], likes: [['pst_1', 'usr_2']] })
		expect((await getPost(posts)(otherViewer, 'pst_1')).viewer).toEqual({
			liked: true,
			saved: false,
			isAuthor: false,
		})
	})

	it('reports missing posts', async () => {
		await expect(getPost(new InMemoryPostRepository())(null, 'pst_1')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
})

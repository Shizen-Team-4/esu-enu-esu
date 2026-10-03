import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { likePost } from './like-post'

const setup = () => ({
	posts: new InMemoryPostRepository({ posts: [aPost({ authorId: 'usr_2' })] }),
	clock: fixedClock(),
})

describe('likePost', () => {
	it('returns the new state', async () => {
		expect(await likePost(setup())(viewer, 'pst_1')).toEqual({ liked: true, likes: 1 })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await likePost(deps)(viewer, 'pst_1')
		expect(await likePost(deps)(viewer, 'pst_1')).toEqual({ liked: true, likes: 1 })
	})

	it('reports a missing post', async () => {
		await expect(likePost(setup())(viewer, 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		await expect(likePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

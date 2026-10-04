import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { unlikePost } from './unlike-post'

const setup = () => ({
	posts: new InMemoryPostRepository({
		posts: [aPost({ authorId: 'usr_2' })],
		likes: [['pst_1', 'usr_1']],
	}),
	clock: fixedClock(),
})

describe('unlikePost', () => {
	it('returns the new state', async () => {
		expect(await unlikePost(setup())(viewer, 'pst_1')).toEqual({ liked: false, likes: 0 })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await unlikePost(deps)(viewer, 'pst_1')
		expect(await unlikePost(deps)(viewer, 'pst_1')).toEqual({ liked: false, likes: 0 })
	})

	it('reports a missing post', async () => {
		await expect(unlikePost(setup())(viewer, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(unlikePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

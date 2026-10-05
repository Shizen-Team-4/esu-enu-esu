import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { unsavePost } from './unsave-post'

const setup = () => ({
	posts: new InMemoryPostRepository({
		posts: [aPost({ authorId: 'usr_2' })],
		saves: [['pst_1', 'usr_1', 1]],
	}),
	clock: fixedClock(),
})

describe('unsavePost', () => {
	it('returns the new state', async () => {
		expect(await unsavePost(setup())(viewer, 'pst_1')).toEqual({ saved: false })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await unsavePost(deps)(viewer, 'pst_1')
		expect(await unsavePost(deps)(viewer, 'pst_1')).toEqual({ saved: false })
	})

	it('reports a missing post', async () => {
		await expect(unsavePost(setup())(viewer, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(unsavePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

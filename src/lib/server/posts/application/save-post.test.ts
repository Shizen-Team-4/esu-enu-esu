import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { savePost } from './save-post'

const setup = () => ({
	posts: new InMemoryPostRepository({ posts: [aPost({ authorId: 'usr_2' })] }),
	clock: fixedClock(),
})

describe('savePost', () => {
	it('returns the new state', async () => {
		expect(await savePost(setup())(viewer, 'pst_1')).toEqual({ saved: true })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await savePost(deps)(viewer, 'pst_1')
		expect(await savePost(deps)(viewer, 'pst_1')).toEqual({ saved: true })
	})

	it('reports a missing post', async () => {
		await expect(savePost(setup())(viewer, 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		await expect(savePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

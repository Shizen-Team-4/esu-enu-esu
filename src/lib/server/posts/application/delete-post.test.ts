import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer, otherViewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { deletePost } from './delete-post'

const setup = () => ({
	posts: new InMemoryPostRepository({ posts: [aPost()] }),
	clock: fixedClock(),
})

describe('deletePost', () => {
	it('deletes an owned post', async () => {
		const deps = setup()
		await deletePost(deps)(viewer, 'pst_1')
		expect(await deps.posts.find('pst_1', null)).toBe(null)
	})

	it('rejects deleting another author’s post', async () => {
		const deps = setup()
		await expect(deletePost(deps)(otherViewer, 'pst_1')).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
		expect(deps.posts.writes).toBe(0)
	})

	it('reports a missing post', async () => {
		await expect(deletePost(setup())(viewer, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(deletePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

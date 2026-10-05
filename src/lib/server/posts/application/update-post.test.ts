import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer, otherViewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { updatePost } from './update-post'

const setup = () => ({
	posts: new InMemoryPostRepository({ posts: [aPost()] }),
	clock: fixedClock(),
})

describe('updatePost', () => {
	it('updates a caption with an edit timestamp', async () => {
		expect(await updatePost(setup())(viewer, 'pst_1', ' Updated ')).toMatchObject({
			caption: 'Updated',
			editedAt: '2026-10-03T00:00:00.000Z',
		})
	})

	it('prevents an empty caption on a text post', async () => {
		await expect(updatePost(setup())(viewer, 'pst_1', '')).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects editing another author’s post', async () => {
		const deps = setup()
		await expect(updatePost(deps)(otherViewer, 'pst_1', 'Updated')).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
		expect(deps.posts.writes).toBe(0)
	})

	it('reports a missing post', async () => {
		await expect(updatePost(setup())(viewer, 'missing', 'Hi')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(updatePost(setup())(null, 'pst_1', 'Hi')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

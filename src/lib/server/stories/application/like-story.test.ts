import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { likeStory } from './like-story'
import { aStory } from './testing/a-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = (story = aStory({ authorId: otherViewer.id })) => ({
	stories: new InMemoryStoryRepository({
		stories: [story],
		follows: [[viewer.id, otherViewer.id]],
	}),
	clock: fixedClock(),
})

describe('likeStory', () => {
	it('likes a story and returns the new count', async () => {
		expect(await likeStory(setup())(viewer, 'sty_1', true)).toEqual({ liked: true, likes: 1 })
	})

	it('is idempotent when liked twice', async () => {
		const deps = setup()
		await likeStory(deps)(viewer, 'sty_1', true)

		expect(await likeStory(deps)(viewer, 'sty_1', true)).toEqual({ liked: true, likes: 1 })
	})

	it('removes the like', async () => {
		const deps = setup()
		await likeStory(deps)(viewer, 'sty_1', true)

		expect(await likeStory(deps)(viewer, 'sty_1', false)).toEqual({ liked: false, likes: 0 })
	})

	it('reports a missing story', async () => {
		await expect(likeStory(setup())(viewer, 'missing', true)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports a story the viewer does not follow as missing', async () => {
		const deps = setup(aStory({ authorId: 'usr_3' }))

		await expect(likeStory(deps)(viewer, 'sty_1', true)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports an expired story as missing', async () => {
		const deps = setup(aStory({ authorId: otherViewer.id, expiresAt: '2026-10-02T23:59:59.000Z' }))

		await expect(likeStory(deps)(viewer, 'sty_1', true)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(likeStory(setup())(null, 'sty_1', true)).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

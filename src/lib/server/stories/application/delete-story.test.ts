import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { deleteStory } from './delete-story'
import { aStory } from './testing/a-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = () => ({
	stories: new InMemoryStoryRepository({
		stories: [aStory({ authorId: viewer.id }), aStory({ id: 'sty_2', authorId: otherViewer.id })],
		follows: [[viewer.id, otherViewer.id]],
	}),
	clock: fixedClock(),
})

describe('deleteStory', () => {
	it('deletes the viewer own story', async () => {
		const deps = setup()
		await deleteStory(deps)(viewer, 'sty_1')

		expect(deps.stories.stories.map((story) => story.id)).toEqual(['sty_2'])
	})

	it('forbids deleting a story of someone else', async () => {
		const deps = setup()

		await expect(deleteStory(deps)(viewer, 'sty_2')).rejects.toMatchObject({ code: 'FORBIDDEN' })
		expect(deps.stories.stories).toHaveLength(2)
	})

	it('reports a missing story', async () => {
		await expect(deleteStory(setup())(viewer, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports an expired story as missing', async () => {
		const deps = setup()
		deps.stories.stories[0] = aStory({ authorId: viewer.id, expiresAt: '2026-10-03T00:00:00.000Z' })

		await expect(deleteStory(deps)(viewer, 'sty_1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		await expect(deleteStory(setup())(null, 'sty_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

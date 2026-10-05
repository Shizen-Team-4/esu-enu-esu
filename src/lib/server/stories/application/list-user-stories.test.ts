import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { listUserStories } from './list-user-stories'
import { aStory } from './testing/a-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = () => ({
	stories: new InMemoryStoryRepository({
		stories: [
			aStory({ id: 'sty_2', authorId: otherViewer.id, createdAt: '2026-10-02T14:00:00.000Z' }),
			aStory({ id: 'sty_1', authorId: otherViewer.id, createdAt: '2026-10-02T13:00:00.000Z' }),
			aStory({ id: 'sty_3', authorId: otherViewer.id, expiresAt: '2026-10-02T23:00:00.000Z' }),
			aStory({ id: 'sty_4', authorId: 'usr_3' }),
		],
		follows: [[viewer.id, otherViewer.id]],
	}),
	clock: fixedClock(),
})

describe('listUserStories', () => {
	it('lists the active stories of a followed user, oldest first', async () => {
		const { items } = await listUserStories(setup())(viewer, otherViewer.id)

		expect(items.map((story) => story.id)).toEqual(['sty_1', 'sty_2'])
	})

	it('lists the viewer own stories', async () => {
		const deps = setup()
		deps.stories.stories.push(aStory({ id: 'sty_5', authorId: viewer.id }))

		const { items } = await listUserStories(deps)(viewer, viewer.id)

		expect(items.map((story) => story.id)).toEqual(['sty_5'])
	})

	it('reports a user the viewer does not follow as missing', async () => {
		await expect(listUserStories(setup())(viewer, 'usr_3')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports an unknown username as missing', async () => {
		await expect(listUserStories(setup())(viewer, 'nobody')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(listUserStories(setup())(null, otherViewer.id)).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

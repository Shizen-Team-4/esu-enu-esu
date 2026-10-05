import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { markStorySeen } from './mark-story-seen'
import { aStory } from './testing/a-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = (story = aStory({ authorId: otherViewer.id })) => ({
	stories: new InMemoryStoryRepository({
		stories: [story],
		follows: [[viewer.id, otherViewer.id]],
	}),
	clock: fixedClock(),
})

const isSeen = async (deps: ReturnType<typeof setup>) =>
	(await deps.stories.find('sty_1', viewer.id, deps.clock.now()))?.viewer.seen

describe('markStorySeen', () => {
	it('marks the story as seen by the viewer', async () => {
		const deps = setup()
		await markStorySeen(deps)(viewer, 'sty_1')

		expect(await isSeen(deps)).toBe(true)
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await markStorySeen(deps)(viewer, 'sty_1')

		await expect(markStorySeen(deps)(viewer, 'sty_1')).resolves.toBeUndefined()
	})

	it('also records views of the viewer own story', async () => {
		const deps = setup(aStory({ authorId: viewer.id }))
		await markStorySeen(deps)(viewer, 'sty_1')

		expect(await isSeen(deps)).toBe(true)
	})

	it('reports a missing story', async () => {
		await expect(markStorySeen(setup())(viewer, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports an expired story as missing', async () => {
		const deps = setup(aStory({ authorId: otherViewer.id, expiresAt: '2026-10-03T00:00:00.000Z' }))

		await expect(markStorySeen(deps)(viewer, 'sty_1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		await expect(markStorySeen(setup())(null, 'sty_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

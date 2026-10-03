import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { sequentialIds } from '../../shared/testing/sequential-ids'
import { viewer } from '../../shared/testing/viewer'
import { createStory } from './create-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = () => ({
	stories: new InMemoryStoryRepository(),
	clock: fixedClock('2026-10-03T00:00:00Z'),
	ids: sequentialIds(),
})

describe('createStory', () => {
	it('creates a story that expires 24 hours later', async () => {
		const story = await createStory(setup())(viewer, { mediaId: 'med_9' })

		expect(story).toMatchObject({
			id: 'sty_1',
			media: { id: 'med_9' },
			author: { id: viewer.id },
			createdAt: '2026-10-03T00:00:00.000Z',
			expiresAt: '2026-10-04T00:00:00.000Z',
			viewer: { seen: false, liked: false },
			likes: 0,
		})
	})

	it('persists the story', async () => {
		const deps = setup()
		await createStory(deps)(viewer, { mediaId: 'med_9' })

		expect(deps.stories.stories).toHaveLength(1)
	})

	it('rejects an invalid media id', async () => {
		await expect(createStory(setup())(viewer, { mediaId: 'nope' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects media that is not the viewer ready story media', async () => {
		const deps = setup()
		deps.stories.mediaValid = false

		await expect(createStory(deps)(viewer, { mediaId: 'med_9' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { mediaId: 'INVALID_FORMAT' },
		})
		expect(deps.stories.stories).toHaveLength(0)
	})

	it('allows a story when 29 posts and stories were created in the last hour', async () => {
		const deps = setup()
		deps.stories.window = { count: 29, oldest: new Date('2026-10-02T23:30:00Z') }

		await expect(createStory(deps)(viewer, { mediaId: 'med_9' })).resolves.toMatchObject({
			id: 'sty_1',
		})
	})

	it('rejects the 31st creation in an hour and says when to retry', async () => {
		const deps = setup()
		deps.stories.window = { count: 30, oldest: new Date('2026-10-02T23:30:00Z') }

		await expect(createStory(deps)(viewer, { mediaId: 'med_9' })).rejects.toMatchObject({
			code: 'RATE_LIMITED',
			retryAfterSec: 1800,
		})
		expect(deps.stories.stories).toHaveLength(0)
	})

	it('checks the rate limit before the media', async () => {
		const deps = setup()
		deps.stories.window = { count: 30, oldest: null }
		deps.stories.mediaValid = false

		await expect(createStory(deps)(viewer, { mediaId: 'med_9' })).rejects.toMatchObject({
			code: 'RATE_LIMITED',
		})
	})

	it('rejects a caption', async () => {
		await expect(
			createStory(setup())(viewer, { mediaId: 'med_9', caption: 'hi' }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fields: { caption: 'NOT_ALLOWED' } })
	})

	it('reports an internal error when the saved story cannot be read back', async () => {
		const deps = setup()
		deps.stories.create = async () => {}

		await expect(createStory(deps)(viewer, { mediaId: 'med_9' })).rejects.toMatchObject({
			code: 'INTERNAL',
		})
	})

	it('requires a viewer', async () => {
		await expect(createStory(setup())(null, { mediaId: 'med_9' })).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { sequentialIds } from '../../shared/testing/sequential-ids'
import { viewer } from '../../shared/testing/viewer'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { createPost } from './create-post'
import { RecordingNotifier } from '../../shared/testing/recording-notifier'

function setup() {
	const posts = new InMemoryPostRepository()
	return { posts, clock: fixedClock(), ids: sequentialIds(), notifier: new RecordingNotifier() }
}
const input = { type: 'post', caption: 'Hello' }

describe('createPost', () => {
	it('creates a validated post with injected time and ID', async () => {
		const deps = setup()
		const post = await createPost(deps)(viewer, input)
		expect(post).toMatchObject({ id: 'pst_1', createdAt: '2026-10-03T00:00:00.000Z' })
		expect(post.viewer.isAuthor).toBe(true)
		expect(deps.posts.writes).toBe(1)
		expect(deps.notifier.events).toEqual([
			{ type: 'post', actorId: viewer.id, postId: post.id, createdAt: deps.clock.now() },
		])
	})

	it('rejects an upload owned by another user', async () => {
		const deps = setup()
		deps.posts.mediaValid = false
		await expect(
			createPost(deps)(viewer, { type: 'post', mediaIds: ['med_1'] }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
		expect(deps.posts.writes).toBe(0)
		expect(deps.notifier.events).toEqual([])
	})

	it('rejects creation when the hourly limit is reached', async () => {
		const deps = setup()
		deps.posts.window = { count: 30, oldest: null }
		await expect(createPost(deps)(viewer, input)).rejects.toMatchObject({ code: 'RATE_LIMITED' })
		expect(deps.notifier.events).toEqual([])
	})

	it('tells the caller when the oldest post leaves the rate-limit window', async () => {
		const deps = setup()
		deps.posts.window = { count: 30, oldest: new Date('2026-10-02T23:30:00Z') }
		await expect(createPost(deps)(viewer, input)).rejects.toMatchObject({
			code: 'RATE_LIMITED',
			retryAfterSec: 1800,
		})
	})

	it('reports an internal error if a created post cannot be loaded', async () => {
		const deps = setup()
		deps.posts.find = async () => null
		await expect(createPost(deps)(viewer, input)).rejects.toMatchObject({ code: 'INTERNAL' })
		expect(deps.notifier.events).toEqual([])
	})

	it('notifies followers of newly published reels too', async () => {
		const deps = setup()
		await createPost(deps)(viewer, { type: 'reel', mediaIds: ['med_1'] })
		expect(deps.notifier.events).toMatchObject([{ type: 'post', postId: 'pst_1' }])
	})

	it('requires a viewer', async () => {
		await expect(createPost(setup())(null, {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
})

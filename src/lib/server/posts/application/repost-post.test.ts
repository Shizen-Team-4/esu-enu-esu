import { describe, expect, it, vi } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { sequentialIds } from '../../shared/testing/sequential-ids'
import { RecordingNotifier } from '../../shared/testing/recording-notifier'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { repostPost } from './repost-post'

function setup() {
	const posts = new InMemoryPostRepository({
		posts: [aPost({ id: 'pst_original', authorId: 'usr_2' })],
	})
	const social = {
		createRepost: vi.fn(async (id: string, authorId: string, originalId: string, now: Date) => {
			await posts.create(id, authorId, { type: 'post', caption: 'Shared', mediaIds: [] }, now)
			posts.posts = posts.posts.map((post) =>
				post.id === id ? { ...post, repostOfId: originalId } : post,
			)
		}),
	}
	return {
		posts,
		social,
		clock: fixedClock(),
		ids: sequentialIds(),
		notifier: new RecordingNotifier(),
	}
}

describe('repostPost', () => {
	it('creates a feed post pointing to the original and notifies followers', async () => {
		const deps = setup()
		const repost = await repostPost(deps)(viewer, 'pst_original')
		expect(repost).toMatchObject({ id: 'pst_1', repostOfId: 'pst_original' })
		expect(deps.social.createRepost).toHaveBeenCalledWith(
			'pst_1',
			viewer.id,
			'pst_original',
			deps.clock.now(),
		)
		expect(deps.notifier.events).toMatchObject([{ type: 'post', postId: 'pst_1' }])
	})

	it('shares the original when reposting a repost', async () => {
		const deps = setup()
		deps.posts.posts.push(aPost({ id: 'pst_shared', repostOfId: 'pst_original' }))
		await repostPost(deps)(viewer, 'pst_shared')
		expect(deps.social.createRepost).toHaveBeenCalledWith(
			'pst_1',
			viewer.id,
			'pst_original',
			expect.any(Date),
		)
	})

	it('rejects missing posts and exhausted creation budgets', async () => {
		const deps = setup()
		await expect(repostPost(deps)(viewer, 'pst_missing')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
		deps.posts.window = { count: 30, oldest: null }
		await expect(repostPost(deps)(viewer, 'pst_original')).rejects.toMatchObject({
			code: 'RATE_LIMITED',
		})
		expect(deps.social.createRepost).not.toHaveBeenCalled()
	})
})

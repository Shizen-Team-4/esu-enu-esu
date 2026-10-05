import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { likePost } from './like-post'
import { RecordingNotifier } from '../../shared/testing/recording-notifier'

const setup = () => ({
	posts: new InMemoryPostRepository({ posts: [aPost({ authorId: 'usr_2' })] }),
	clock: fixedClock(),
	notifier: new RecordingNotifier(),
})

describe('likePost', () => {
	it('returns the new state', async () => {
		expect(await likePost(setup())(viewer, 'pst_1')).toEqual({ liked: true, likes: 1 })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await likePost(deps)(viewer, 'pst_1')
		expect(await likePost(deps)(viewer, 'pst_1')).toEqual({ liked: true, likes: 1 })
		expect(deps.notifier.events).toEqual([
			{
				type: 'like',
				actorId: viewer.id,
				recipientId: 'usr_2',
				postId: 'pst_1',
				createdAt: deps.clock.now(),
			},
		])
	})

	it('does not notify for a like that predates deployment', async () => {
		const deps = setup()
		await deps.posts.react('pst_1', viewer.id, 'like', true, deps.clock.now())
		await likePost(deps)(viewer, 'pst_1')
		expect(deps.notifier.events).toEqual([])
	})

	it('does not notify after a rejected write', async () => {
		const deps = setup()
		deps.posts.react = async () => {
			throw new Error('write failed')
		}
		await expect(likePost(deps)(viewer, 'pst_1')).rejects.toThrow('write failed')
		expect(deps.notifier.events).toEqual([])
	})

	it('does not notify if the post becomes unavailable after its reaction write', async () => {
		const deps = setup()
		let reads = 0
		const find = deps.posts.find.bind(deps.posts)
		deps.posts.find = async (...args) => {
			reads++
			return reads === 1 ? find(...args) : null
		}
		await expect(likePost(deps)(viewer, 'pst_1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
		expect(deps.notifier.events).toEqual([])
	})

	it('reports a missing post', async () => {
		await expect(likePost(setup())(viewer, 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		await expect(likePost(setup())(null, 'pst_1')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

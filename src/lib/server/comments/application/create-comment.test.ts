import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { sequentialIds } from '../../shared/testing/sequential-ids'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { aComment } from './testing/a-comment'
import {
	InMemoryCommentRepository,
	inMemoryPostLookup,
} from './testing/in-memory-comment-repository'
import { createComment } from './create-comment'
import { RecordingNotifier } from '../../shared/testing/recording-notifier'

const posts = inMemoryPostLookup({ pst_1: 'usr_9', pst_2: 'usr_9' })
const setup = (comments: Parameters<typeof aComment>[0][] = []) => {
	const repository = new InMemoryCommentRepository(comments.map((c) => aComment(c)))
	const notifier = new RecordingNotifier()
	const create = createComment({
		comments: repository,
		posts,
		clock: fixedClock(),
		ids: sequentialIds(),
		notifier,
	})
	return { repository, create, notifier }
}

describe('createComment', () => {
	it('creates a top-level comment and counts it on the post', async () => {
		const { repository, create, notifier } = setup()
		const comment = await create(viewer, { postId: 'pst_1', body: ' Hello ', parentId: null })
		expect(comment).toMatchObject({
			id: 'cmt_1',
			postId: 'pst_1',
			body: 'Hello',
			parentId: null,
			replyToUser: null,
			replyToCommentId: null,
			replyCount: 0,
			viewer: { canDelete: true },
			createdAt: '2026-10-03T00:00:00.000Z',
		})
		expect(comment.author.id).toBe(viewer.id)
		expect(repository.postCounts.get('pst_1')).toBe(1)
		expect(notifier.events).toMatchObject([
			{
				type: 'comment',
				actorId: viewer.id,
				postAuthorId: 'usr_9',
				replyAuthorId: null,
				commentId: comment.id,
			},
		])
	})

	it('replies to a top-level comment without a replyTo user', async () => {
		const { repository, create } = setup([{ id: 'cmt_10' }])
		const reply = await create(viewer, { postId: 'pst_1', body: 'Yes', parentId: 'cmt_10' })
		expect(reply).toMatchObject({ parentId: 'cmt_10', replyToUser: null })
		expect((await repository.find('cmt_10'))?.replyCount).toBe(1)
	})

	it('flattens a reply to a reply under the top-level comment', async () => {
		const { repository, create, notifier } = setup([
			{ id: 'cmt_10' },
			{ id: 'cmt_11', parentId: 'cmt_10', authorId: 'usr_3' },
		])
		const reply = await create(viewer, { postId: 'pst_1', body: 'Yes', parentId: 'cmt_11' })
		expect(reply.parentId).toBe('cmt_10')
		expect(reply.replyToCommentId).toBe('cmt_11')
		expect(reply.replyToUser?.id).toBe('usr_3')
		expect((await repository.find('cmt_10'))?.replyCount).toBe(1)
		expect(notifier.events).toMatchObject([{ replyAuthorId: 'usr_3', commentId: reply.id }])
	})

	it('uses the exact top-level target author when replying directly', async () => {
		const { create, notifier } = setup([{ id: 'cmt_10', authorId: 'usr_4' }])
		await create(viewer, { postId: 'pst_1', body: 'Reply', parentId: 'cmt_10' })
		expect(notifier.events).toMatchObject([{ replyAuthorId: 'usr_4' }])
	})

	it('does not notify when persistence fails', async () => {
		const { create, repository, notifier } = setup()
		repository.create = async () => {
			throw new Error('write failed')
		}
		await expect(create(viewer, { postId: 'pst_1', body: 'Hello' })).rejects.toThrow('write failed')
		expect(notifier.events).toEqual([])
	})

	it('does not notify if the created comment cannot be loaded', async () => {
		const { create, repository, notifier } = setup()
		repository.find = async () => null
		await expect(create(viewer, { postId: 'pst_1', body: 'Hello' })).rejects.toMatchObject({
			code: 'INTERNAL',
		})
		expect(notifier.events).toEqual([])
	})

	it('requires a logged-in viewer', async () => {
		await expect(setup().create(null, { postId: 'pst_1', body: 'x' })).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})

	it('rejects an invalid body and parent id', async () => {
		const { create } = setup()
		await expect(create(viewer, { postId: 'pst_1', body: '' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { body: 'REQUIRED' },
		})
		await expect(
			create(viewer, { postId: 'pst_1', body: 'x', parentId: 'x' }),
		).rejects.toMatchObject({ fields: { parentId: 'INVALID_FORMAT' } })
		await expect(create(viewer, 'nope')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
	})

	it('reports a missing post', async () => {
		const { create } = setup()
		await expect(create(viewer, { postId: 'pst_x', body: 'x' })).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
		await expect(create(viewer, { postId: 5, body: 'x' })).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports a missing parent or a parent on another post', async () => {
		const { create } = setup([{ id: 'cmt_10', postId: 'pst_2' }])
		for (const parentId of ['cmt_99', 'cmt_10'])
			await expect(create(viewer, { postId: 'pst_1', body: 'x', parentId })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			})
	})

	it('allows the 60th comment in the window', async () => {
		const { repository, create } = setup()
		repository.window = { count: 59, oldest: new Date('2026-10-02T23:30:00Z') }
		await expect(create(otherViewer, { postId: 'pst_1', body: 'x' })).resolves.toBeTruthy()
	})

	it('rejects the 61st comment with the time until the oldest leaves the window', async () => {
		const { repository, create } = setup()
		repository.window = { count: 60, oldest: new Date('2026-10-02T23:30:00Z') }
		await expect(create(viewer, { postId: 'pst_1', body: 'x' })).rejects.toMatchObject({
			code: 'RATE_LIMITED',
			retryAfterSec: 30 * 60,
		})
		expect(repository.comments).toHaveLength(0)
	})
})

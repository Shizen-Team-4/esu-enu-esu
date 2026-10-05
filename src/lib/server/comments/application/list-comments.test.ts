import { describe, expect, it } from 'vitest'
import { aComment } from './testing/a-comment'
import {
	InMemoryCommentRepository,
	inMemoryPostLookup,
} from './testing/in-memory-comment-repository'
import { listComments } from './list-comments'

const posts = inMemoryPostLookup({ pst_1: 'usr_1' })
const seed = () =>
	new InMemoryCommentRepository([
		aComment({ id: 'cmt_1', createdAt: '2026-10-01T00:00:00.000Z', replyCount: 1 }),
		aComment({ id: 'cmt_2', createdAt: '2026-10-02T00:00:00.000Z' }),
		aComment({ id: 'cmt_3', parentId: 'cmt_1', createdAt: '2026-10-03T00:00:00.000Z' }),
		aComment({ id: 'cmt_4', postId: 'pst_2' }),
	])
const ids = (page: { items: { id: string }[] }) => page.items.map((comment) => comment.id)

describe('listComments', () => {
	it('lists top-level comments of the post newest first', async () => {
		const page = await listComments({ comments: seed(), posts })(null, { postId: 'pst_1' })
		expect(ids(page)).toEqual(['cmt_2', 'cmt_1'])
		expect(page.nextCursor).toBe(null)
		expect(page.items[1].replyCount).toBe(1)
	})

	it('returns an empty page for a post with no comments', async () => {
		const empty = new InMemoryCommentRepository()
		expect(await listComments({ comments: empty, posts })(null, { postId: 'pst_1' })).toEqual({
			items: [],
			nextCursor: null,
		})
	})

	it('sets canDelete for the comment author and the post author only', async () => {
		const run = (id: string) =>
			listComments({ comments: seed(), posts })({ id, role: 'user' }, { postId: 'pst_1' })
		expect((await run('usr_1')).items.every((c) => c.viewer.canDelete)).toBe(true)
		expect((await run('usr_2')).items.every((c) => c.viewer.canDelete)).toBe(true)
		expect((await run('usr_9')).items.some((c) => c.viewer.canDelete)).toBe(false)
	})

	it('pages with a cursor', async () => {
		const deps = { comments: seed(), posts }
		const first = await listComments(deps)(null, { postId: 'pst_1', limit: 1 })
		expect(ids(first)).toEqual(['cmt_2'])
		const second = await listComments(deps)(null, {
			postId: 'pst_1',
			limit: 1,
			cursor: first.nextCursor ?? '',
		})
		expect(ids(second)).toEqual(['cmt_1'])
		expect(second.nextCursor).toBe(null)
	})

	it('reports an unknown post', async () => {
		await expect(
			listComments({ comments: seed(), posts })(null, { postId: 'pst_9' }),
		).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('rejects a bad cursor and a bad limit', async () => {
		const run = listComments({ comments: seed(), posts })
		await expect(run(null, { postId: 'pst_1', cursor: '!!' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { cursor: 'INVALID_FORMAT' },
		})
		await expect(run(null, { postId: 'pst_1', limit: 51 })).rejects.toMatchObject({
			fields: { limit: 'INVALID_FORMAT' },
		})
	})
})

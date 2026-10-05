import { describe, expect, it } from 'vitest'
import { aComment } from './testing/a-comment'
import {
	InMemoryCommentRepository,
	inMemoryPostLookup,
} from './testing/in-memory-comment-repository'
import { listReplies } from './list-replies'

const posts = inMemoryPostLookup({ pst_1: 'usr_1' })
const seed = () =>
	new InMemoryCommentRepository([
		aComment({ id: 'cmt_1', replyCount: 2 }),
		aComment({ id: 'cmt_3', parentId: 'cmt_1', createdAt: '2026-10-03T00:00:00.000Z' }),
		aComment({ id: 'cmt_2', parentId: 'cmt_1', createdAt: '2026-10-02T00:00:00.000Z' }),
		aComment({ id: 'cmt_5' }),
		aComment({ id: 'cmt_6', postId: 'pst_9' }),
	])
const ids = (page: { items: { id: string }[] }) => page.items.map((comment) => comment.id)

describe('listReplies', () => {
	it('lists replies oldest first', async () => {
		const page = await listReplies({ comments: seed(), posts })(null, { commentId: 'cmt_1' })
		expect(ids(page)).toEqual(['cmt_2', 'cmt_3'])
	})

	it('returns an empty page when there are no replies', async () => {
		const page = await listReplies({ comments: seed(), posts })(null, { commentId: 'cmt_5' })
		expect(page).toEqual({ items: [], nextCursor: null })
	})

	it('pages with a cursor', async () => {
		const deps = { comments: seed(), posts }
		const first = await listReplies(deps)(null, { commentId: 'cmt_1', limit: 1 })
		expect(ids(first)).toEqual(['cmt_2'])
		const second = await listReplies(deps)(null, {
			commentId: 'cmt_1',
			limit: 1,
			cursor: first.nextCursor ?? '',
		})
		expect(ids(second)).toEqual(['cmt_3'])
		expect(second.nextCursor).toBe(null)
	})

	it('reports an unknown comment, a reply id and a comment on a missing post', async () => {
		const run = listReplies({ comments: seed(), posts })
		for (const commentId of ['cmt_9', 'cmt_2', 'cmt_6'])
			await expect(run(null, { commentId })).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('rejects a bad cursor', async () => {
		await expect(
			listReplies({ comments: seed(), posts })(null, { commentId: 'cmt_1', cursor: '!!' }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
	})
})

import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { aComment } from './testing/a-comment'
import {
	InMemoryCommentRepository,
	inMemoryPostLookup,
} from './testing/in-memory-comment-repository'
import { deleteComment } from './delete-comment'

const posts = inMemoryPostLookup({ pst_1: 'usr_9' })
const as = (id: string) => ({ id, role: 'user' as const })
const setup = () => {
	const repository = new InMemoryCommentRepository([
		aComment({ id: 'cmt_1', authorId: viewer.id, replyCount: 2 }),
		aComment({ id: 'cmt_2', parentId: 'cmt_1', authorId: 'usr_3' }),
		aComment({ id: 'cmt_3', parentId: 'cmt_1', authorId: 'usr_4' }),
		aComment({ id: 'cmt_4', postId: 'pst_gone' }),
	])
	return { repository, run: deleteComment({ comments: repository, posts }) }
}

describe('deleteComment', () => {
	it('lets the comment author delete a top-level comment with its replies', async () => {
		const { repository, run } = setup()
		await run(viewer, 'cmt_1')
		expect(repository.comments.map((c) => c.id)).toEqual(['cmt_4'])
		expect(repository.postCounts.get('pst_1')).toBe(0)
	})

	it('lets the post author delete a comment', async () => {
		const { repository, run } = setup()
		await run(as('usr_9'), 'cmt_1')
		expect(await repository.find('cmt_1')).toBe(null)
	})

	it('lowers the parent reply count when a reply is deleted', async () => {
		const { repository, run } = setup()
		await run(as('usr_3'), 'cmt_2')
		expect((await repository.find('cmt_1'))?.replyCount).toBe(1)
		expect(repository.postCounts.get('pst_1')).toBe(2)
	})

	it('requires a logged-in viewer', async () => {
		await expect(setup().run(null, 'cmt_1')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})

	it('reports an unknown comment or one on a missing post', async () => {
		for (const id of ['cmt_99', 'cmt_4'])
			await expect(setup().run(viewer, id)).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('forbids everyone else and keeps the comment', async () => {
		const { repository, run } = setup()
		await expect(run(as('usr_5'), 'cmt_1')).rejects.toMatchObject({ code: 'FORBIDDEN' })
		expect(await repository.find('cmt_1')).not.toBe(null)
	})
})

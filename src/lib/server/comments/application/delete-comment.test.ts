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
	it('preserves other comments when their parent is deleted by its author', async () => {
		const { repository, run } = setup()
		await run(viewer, 'cmt_1')
		expect(repository.comments.map((c) => c.id)).toEqual(['cmt_2', 'cmt_3', 'cmt_4'])
		expect((await repository.find('cmt_2'))?.parentId).toBe(null)
		expect(repository.postCounts.get('pst_1')).toBe(2)
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

	it('does not delete the post author reply when its parent author removes their comment', async () => {
		const { repository, run } = setup()
		repository.comments.push(aComment({ id: 'cmt_owner', parentId: 'cmt_1', authorId: 'usr_9' }))
		await run(viewer, 'cmt_1')
		expect(await repository.find('cmt_owner')).toMatchObject({ id: 'cmt_owner', parentId: null })
	})

	it('forbids a commenter from deleting the post author comment directly', async () => {
		const { repository, run } = setup()
		repository.comments.push(aComment({ id: 'cmt_owner', authorId: 'usr_9' }))
		await expect(run(viewer, 'cmt_owner')).rejects.toMatchObject({ code: 'FORBIDDEN' })
		expect(await repository.find('cmt_owner')).not.toBe(null)
	})

	it('allows the post author to delete their own comment', async () => {
		const { repository, run } = setup()
		repository.comments.push(aComment({ id: 'cmt_owner', authorId: 'usr_9' }))
		await run(as('usr_9'), 'cmt_owner')
		expect(await repository.find('cmt_owner')).toBe(null)
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

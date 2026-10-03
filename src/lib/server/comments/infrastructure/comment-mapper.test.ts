import { describe, expect, it } from 'vitest'
import { toComment, type CommentRow } from './comment-mapper'

const row: CommentRow = {
	id: 'cmt_1',
	postId: 'pst_1',
	parentId: null,
	body: 'Hi',
	replyCount: 2,
	createdAt: Date.parse('2026-10-03T00:00:00Z'),
	authorId: 'usr_1',
	username: 'ann',
	name: 'Ann',
	image: 'https://example.com/a.png',
	replyToId: null,
	replyToUsername: null,
	replyToName: null,
	replyToImage: null,
}

describe('toComment', () => {
	it('maps a top-level comment', () => {
		expect(toComment(row)).toEqual({
			id: 'cmt_1',
			postId: 'pst_1',
			author: {
				id: 'usr_1',
				username: 'ann',
				displayName: 'Ann',
				avatarUrl: 'https://example.com/a.png',
			},
			body: 'Hi',
			parentId: null,
			replyToUser: null,
			replyCount: 2,
			createdAt: '2026-10-03T00:00:00.000Z',
		})
	})

	it('maps the replied-to user and falls back to empty names', () => {
		const comment = toComment({
			...row,
			parentId: 'cmt_0',
			username: null,
			replyToId: 'usr_2',
			replyToUsername: null,
			replyToName: null,
			replyToImage: null,
		})
		expect(comment.author.username).toBe('')
		expect(comment.replyToUser).toEqual({
			id: 'usr_2',
			username: '',
			displayName: '',
			avatarUrl: null,
		})
	})
})

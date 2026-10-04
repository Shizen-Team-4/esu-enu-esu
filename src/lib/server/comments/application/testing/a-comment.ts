import type { StoredComment } from '../../domain/comment'

export const aUser = (id: string) => ({
	id,
	username: id,
	displayName: id,
	avatarUrl: null,
})

export function aComment(
	overrides: Partial<StoredComment> & { authorId?: string } = {},
): StoredComment {
	const { authorId, ...rest } = overrides
	return {
		id: 'cmt_1',
		postId: 'pst_1',
		author: aUser(authorId ?? 'usr_2'),
		body: 'Nice',
		parentId: null,
		replyToUser: null,
		replyToCommentId: null,
		replyCount: 0,
		createdAt: '2026-10-03T00:00:00.000Z',
		...rest,
	}
}

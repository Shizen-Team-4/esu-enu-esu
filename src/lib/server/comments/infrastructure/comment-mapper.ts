import type { StoredComment } from '../domain/comment'

export interface CommentRow {
	id: string
	postId: string
	parentId: string | null
	body: string
	replyCount: number
	createdAt: number
	authorId: string
	username: string | null
	name: string
	image: string | null
	replyToId: string | null
	replyToUsername: string | null
	replyToName: string | null
	replyToImage: string | null
}

export function toComment(row: CommentRow): StoredComment {
	return {
		id: row.id,
		postId: row.postId,
		author: {
			id: row.authorId,
			username: row.username ?? '',
			displayName: row.name,
			avatarUrl: row.image,
		},
		body: row.body,
		parentId: row.parentId,
		replyToUser:
			row.replyToId === null
				? null
				: {
						id: row.replyToId,
						username: row.replyToUsername ?? '',
						displayName: row.replyToName ?? '',
						avatarUrl: row.replyToImage,
					},
		replyCount: row.replyCount,
		createdAt: new Date(row.createdAt).toISOString(),
	}
}

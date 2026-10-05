import type { Post, Media } from '../domain/post'

export interface PostRow {
	id: string
	type: 'post' | 'reel'
	caption: string
	authorId: string
	username: string | null
	name: string
	image: string | null
	likeCount: number
	commentCount: number
	createdAt: number
	editedAt: number | null
}

export function toPost(
	row: PostRow,
	data: { media: Media[]; liked: boolean; saved: boolean; viewerId: string | null; origin: string },
): Post {
	return {
		id: row.id,
		type: row.type,
		caption: row.caption,
		author: {
			id: row.authorId,
			username: row.username ?? '',
			displayName: row.name,
			avatarUrl: row.image,
		},
		media: data.media,
		counts: { likes: row.likeCount, comments: row.commentCount },
		viewer: { liked: data.liked, saved: data.saved, isAuthor: data.viewerId === row.authorId },
		shareUrl: `${data.origin}/p/${row.id}`,
		createdAt: new Date(row.createdAt).toISOString(),
		editedAt: row.editedAt === null ? null : new Date(row.editedAt).toISOString(),
	}
}

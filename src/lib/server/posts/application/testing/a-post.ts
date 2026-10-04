import type { Post } from '../../domain/post'

export function aPost(overrides: Partial<Post> & { authorId?: string } = {}): Post {
	const { authorId, ...rest } = overrides
	const id = rest.id ?? 'pst_1'
	const author = authorId ?? 'usr_1'
	return {
		id,
		type: 'post',
		author: { id: author, username: author, displayName: author, avatarUrl: null },
		caption: 'Hello',
		media: [],
		counts: { likes: 0, comments: 0 },
		viewer: { liked: false, saved: false, isAuthor: false },
		shareUrl: `https://example.com/p/${id}`,
		createdAt: '2026-10-03T00:00:00.000Z',
		editedAt: null,
		...rest,
	}
}

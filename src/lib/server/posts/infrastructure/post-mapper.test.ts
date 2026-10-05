import { describe, expect, it } from 'vitest'
import { toPost, type PostRow } from './post-mapper'

describe('post mapper', () => {
	it('maps timestamps, nullable username and viewer state', () => {
		const row: PostRow = {
			id: 'pst_1',
			type: 'post',
			caption: 'Hello',
			authorId: 'usr_1',
			username: null,
			name: 'User',
			image: null,
			likeCount: 2,
			commentCount: 3,
			createdAt: 0,
			editedAt: null,
		}
		expect(
			toPost(row, {
				media: [],
				liked: false,
				saved: false,
				viewerId: null,
				origin: 'https://example.com',
			}),
		).toMatchObject({
			author: { username: '' },
			createdAt: '1970-01-01T00:00:00.000Z',
			editedAt: null,
			viewer: { isAuthor: false },
			shareUrl: 'https://example.com/p/pst_1',
		})
		expect(
			toPost(
				{ ...row, editedAt: 1, username: 'user' },
				{ media: [], liked: true, saved: true, viewerId: 'usr_1', origin: 'https://example.com' },
			),
		).toMatchObject({
			editedAt: '1970-01-01T00:00:00.001Z',
			viewer: { isAuthor: true, liked: true },
		})
	})
})

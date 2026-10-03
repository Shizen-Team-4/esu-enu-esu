import { describe, expect, it } from 'vitest'
import { createPost } from './create-post'
import { getPost } from './get-post'
import { updatePost } from './update-post'
import { deletePost } from './delete-post'
import { listPosts } from './list-posts'
import { reactToPost } from './react-to-post'
import type { PostRepository } from './ports'
import type { Post } from '../domain/post'

const viewer = { id: 'usr_1', role: 'user' as const }
function setup() {
	let post: Post | null = {
		id: 'pst_1',
		type: 'post',
		author: { id: 'usr_1', username: 'user', displayName: 'User', avatarUrl: null },
		caption: 'Hello',
		media: [],
		counts: { likes: 0, comments: 0 },
		viewer: { liked: false, saved: false, isAuthor: true },
		shareUrl: 'https://example.com/p/pst_1',
		createdAt: '2026-10-03T00:00:00.000Z',
		editedAt: null,
	}
	let writes = 0
	const posts: PostRepository = {
		find: async () => post,
		list: async () => ({ items: post ? [post] : [], nextCursor: null }),
		create: async () => {
			writes++
		},
		update: async (_id, caption, now) => {
			writes++
			if (post) post = { ...post, caption, editedAt: now.toISOString() }
		},
		delete: async () => {
			writes++
			post = null
		},
		react: async () => {
			writes++
		},
		checkMedia: async () => true,
		creationWindow: async () => ({ count: 0, oldest: null }),
	}
	const deps = {
		posts,
		clock: { now: () => new Date('2026-10-03T00:00:00Z') },
		ids: { generate: () => 'pst_1' },
	}
	return {
		...deps,
		setPost: (value: Post | null) => {
			post = value
		},
		get post() {
			return post
		},
		get writes() {
			return writes
		},
	}
}

describe('post operations', () => {
	it('creates a validated post with injected time and ID', async () => {
		const deps = setup()
		expect((await createPost(deps)(viewer, { type: 'post', caption: 'Hello' })).id).toBe('pst_1')
		expect(deps.writes).toBe(1)
	})
	it('rejects an upload owned by another user', async () => {
		const deps = setup()
		deps.posts.checkMedia = async () => false
		await expect(
			createPost(deps)(viewer, { type: 'post', mediaIds: ['med_1'] }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
		expect(deps.writes).toBe(0)
	})
	it('rejects creation when the hourly limit is reached', async () => {
		const deps = setup()
		deps.posts.creationWindow = async () => ({ count: 30, oldest: null })
		await expect(
			createPost(deps)(viewer, { type: 'post', caption: 'Hello' }),
		).rejects.toMatchObject({ code: 'RATE_LIMITED' })
	})
	it('reports an internal error if a created post cannot be loaded', async () => {
		const deps = setup()
		deps.setPost(null)
		await expect(
			createPost(deps)(viewer, { type: 'post', caption: 'Hello' }),
		).rejects.toMatchObject({ code: 'INTERNAL' })
	})
	it('allows public reads and reports missing posts', async () => {
		const deps = setup()
		expect((await getPost(deps.posts)(null, 'pst_1')).caption).toBe('Hello')
		deps.setPost(null)
		await expect(getPost(deps.posts)(null, 'pst_1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})
	it('updates a caption with an edit timestamp', async () => {
		const deps = setup()
		expect(await updatePost(deps)(viewer, 'pst_1', ' Updated ')).toMatchObject({
			caption: 'Updated',
			editedAt: '2026-10-03T00:00:00.000Z',
		})
	})
	it('prevents an empty caption on a text post', async () => {
		await expect(updatePost(setup())(viewer, 'pst_1', '')).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
	it('deletes an owned post', async () => {
		const deps = setup()
		await deletePost(deps)(viewer, 'pst_1')
		expect(deps.post).toBe(null)
	})
	it('rejects editing and deleting another author’s post', async () => {
		const deps = setup()
		const other = { id: 'usr_2', role: 'user' as const }
		await expect(updatePost(deps)(other, 'pst_1', 'Updated')).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
		await expect(deletePost(deps)(other, 'pst_1')).rejects.toMatchObject({ code: 'FORBIDDEN' })
		expect(deps.writes).toBe(0)
	})
	it('reports missing posts for mutations', async () => {
		const deps = setup()
		deps.setPost(null)
		await expect(updatePost(deps)(viewer, 'missing', 'Hi')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
		await expect(deletePost(deps)(viewer, 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' })
		await expect(reactToPost(deps)(viewer, 'missing', 'like', true)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
	it('requires a viewer for writes', async () => {
		const deps = setup()
		await expect(createPost(deps)(null, {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
		await expect(updatePost(deps)(null, 'pst_1', 'Hi')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
		await expect(deletePost(deps)(null, 'pst_1')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
		await expect(reactToPost(deps)(null, 'pst_1', 'save', true)).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
	it('writes reactions for accessible posts', async () => {
		const deps = setup()
		await reactToPost(deps)(viewer, 'pst_1', 'like', true)
		expect(deps.writes).toBe(1)
	})
	it('lists public posts, saved posts and a cursor page', async () => {
		const deps = setup()
		expect((await listPosts(deps.posts)(null)).items.length).toBe(1)
		expect(
			(
				await listPosts(deps.posts)(viewer, {
					scope: 'saved',
					cursor: btoa('1:pst_1').replace(/=+$/, ''),
				})
			).items.length,
		).toBe(1)
	})
	it('rejects an invalid scope and protects personalized feeds', async () => {
		const deps = setup()
		await expect(listPosts(deps.posts)(null, { scope: 'invalid' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
		await expect(listPosts(deps.posts)(null, { scope: 'following' })).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

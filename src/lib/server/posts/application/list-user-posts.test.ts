import { describe, expect, it } from 'vitest'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { listUserPosts } from './list-user-posts'

const authors = {
	findIdByUsername: async (username: string) => (username === 'usr_1' ? 'usr_1' : null),
}
const repository = () =>
	new InMemoryPostRepository({
		posts: [
			aPost({ id: 'pst_1', authorId: 'usr_1' }),
			aPost({ id: 'pst_2', authorId: 'usr_1', type: 'reel' }),
			aPost({ id: 'pst_3', authorId: 'usr_2' }),
		],
	})
const run = (input: Parameters<ReturnType<typeof listUserPosts>>[1]) =>
	listUserPosts({ posts: repository(), authors })(null, input)
const ids = (page: { items: { id: string }[] }) => page.items.map((post) => post.id)

describe('listUserPosts', () => {
	it('lists the author’s posts and reels when no type is given', async () => {
		expect(ids(await run({ username: 'usr_1' }))).toEqual(['pst_2', 'pst_1'])
	})

	it('excludes reels for type post', async () => {
		expect(ids(await run({ username: 'usr_1', type: 'post' }))).toEqual(['pst_1'])
	})

	it('returns only reels for type reel', async () => {
		expect(ids(await run({ username: 'usr_1', type: 'reel' }))).toEqual(['pst_2'])
	})

	it('returns an empty page when the author has no matching posts', async () => {
		const deps = { posts: new InMemoryPostRepository(), authors }
		expect(await listUserPosts(deps)(null, { username: 'usr_1' })).toEqual({
			items: [],
			nextCursor: null,
		})
	})

	it('reports unknown or empty usernames', async () => {
		for (const username of ['nobody', '', undefined, 5])
			await expect(run({ username })).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('rejects an invalid type', async () => {
		await expect(run({ username: 'usr_1', type: 'story' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('pages with a cursor and ends with a null cursor', async () => {
		const deps = { posts: repository(), authors }
		const first = await listUserPosts(deps)(null, { username: 'usr_1', limit: 1 })
		expect(ids(first)).toEqual(['pst_2'])
		const cursor = first.nextCursor ?? ''
		const second = await listUserPosts(deps)(null, { username: 'usr_1', limit: 1, cursor })
		expect(ids(second)).toEqual(['pst_1'])
		expect(second.nextCursor).toBe(null)
	})
})

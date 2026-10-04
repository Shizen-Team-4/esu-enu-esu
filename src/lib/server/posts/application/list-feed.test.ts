import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { aPost } from './testing/a-post'
import { InMemoryPostRepository } from './testing/in-memory-post-repository'
import { listFeed } from './list-feed'

const posts = () =>
	new InMemoryPostRepository({
		posts: [
			aPost({ id: 'pst_1', authorId: 'usr_1', createdAt: '2026-10-01T00:00:00.000Z' }),
			aPost({ id: 'pst_2', authorId: 'usr_2', createdAt: '2026-10-02T00:00:00.000Z' }),
			aPost({ id: 'pst_3', authorId: 'usr_3', createdAt: '2026-10-03T00:00:00.000Z' }),
		],
		follows: [['usr_1', 'usr_2']],
	})
const ids = (page: { items: { id: string }[] }) => page.items.map((post) => post.id)

describe('listFeed', () => {
	it('lists all posts newest first for guests', async () => {
		expect(ids(await listFeed(posts())(null))).toEqual(['pst_3', 'pst_2', 'pst_1'])
	})

	it('requires a viewer for the following scope', async () => {
		await expect(listFeed(posts())(null, { scope: 'following' })).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})

	it('returns followed authors and own posts in the following scope', async () => {
		const page = await listFeed(posts())(viewer, { scope: 'following' })
		expect(ids(page)).toEqual(['pst_2', 'pst_1'])
	})

	it('rejects the saved scope and unknown scopes', async () => {
		for (const scope of ['saved', 'garbage'])
			await expect(listFeed(posts())(viewer, { scope })).rejects.toMatchObject({
				code: 'VALIDATION_FAILED',
			})
	})

	it('rejects an invalid cursor', async () => {
		await expect(listFeed(posts())(null, { cursor: '!!!' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects an invalid limit', async () => {
		await expect(listFeed(posts())(null, { limit: 0 })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
})

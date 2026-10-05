import { describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../db/schema'
import { ScriptedD1 } from '../../shared/testing/scripted-d1'
import { createPostRepository } from './drizzle-posts'

const row = {
	id: 'pst_2',
	type: 'post',
	caption: 'Hello',
	authorId: 'usr_2',
	username: 'dara',
	name: 'Dara',
	image: null,
	likeCount: 1,
	commentCount: 2,
	createdAt: 10,
	editedAt: null,
	sortTime: 10,
}
function setup() {
	const d1 = new ScriptedD1()
	return {
		d1,
		posts: createPostRepository(drizzle(d1, { schema }), d1, {
			origin: 'https://example.com',
			media: 'https://media.example.com',
		}),
	}
}
describe('post persistence', () => {
	it('hydrates media and viewer state in batch queries', async () => {
		const { d1, posts } = setup()
		d1.respond(
			{ rows: [row] },
			{
				rows: [
					{
						postId: 'pst_2',
						id: 'med_1',
						type: 'video',
						key: 'video.mp4',
						thumbnail: 'poster.webp',
						width: 100,
						height: 100,
						duration: 2,
					},
					{
						postId: 'pst_2',
						id: 'med_2',
						type: 'image',
						key: 'photo.jpg',
						thumbnail: null,
						width: 100,
						height: 100,
						duration: null,
					},
				],
			},
			{ rows: [{ id: 'pst_2' }] },
			{ rows: [{ id: 'pst_2' }] },
		)
		const post = await posts.find('pst_2', 'usr_1')
		expect(post?.viewer).toEqual({ liked: true, saved: true, isAuthor: false })
		expect(post?.media.map((media) => media.thumbnailUrl)).toEqual([
			'https://media.example.com/poster.webp',
			null,
		])
	})
	it('returns null for unavailable posts without querying media', async () => {
		const { d1, posts } = setup()
		d1.respond({ rows: [] })
		expect(await posts.find('pst_missing', null)).toBeNull()
		expect(d1.calls).toHaveLength(1)
	})
	it.each(['all', 'following', 'saved'] as const)(
		'lists %s with stable cursor pagination',
		async (scope) => {
			const { d1, posts } = setup()
			d1.respond({ rows: [row, { ...row, id: 'pst_1' }] }, { rows: [] }, { rows: [] }, { rows: [] })
			const result = await posts.list({
				scope,
				viewerId: 'usr_1',
				type: 'post',
				authorId: 'usr_2',
				cursor: { time: 20, id: 'pst_3' },
				limit: 1,
			})
			expect(result.items).toHaveLength(1)
			expect(result.nextCursor).not.toBeNull()
			expect(d1.calls[0].sql).toContain(scope === 'saved' ? 's.created_at' : 'p.created_at')
		},
	)
	it('skips viewer queries for anonymous listing and handles empty lists', async () => {
		const { d1, posts } = setup()
		d1.respond({ rows: [row] }, { rows: [] }, { rows: [] })
		expect((await posts.list({ scope: 'all', viewerId: null, limit: 20 })).nextCursor).toBeNull()
		expect(await posts.list({ scope: 'all', viewerId: null, limit: 20 })).toEqual({
			items: [],
			nextCursor: null,
		})
	})
	it('checks empty media and ownership-purpose readiness of attached media', async () => {
		const { d1, posts } = setup()
		d1.respond({ rows: [{ id: 'med_1' }] }, { rows: [] })
		expect(await posts.checkMedia([], 'usr_1', 'post')).toBe(true)
		expect(await posts.checkMedia([], 'usr_1', 'reel')).toBe(false)
		expect(await posts.checkMedia(['med_1'], 'usr_1', 'reel')).toBe(true)
		expect(d1.calls[0].sql).toContain("type = 'video'")
		expect(await posts.checkMedia(['med_2'], 'usr_1', 'post')).toBe(false)
	})
	it('maps the creation window and empty defaults', async () => {
		const { d1, posts } = setup()
		d1.respond({ rows: [{ count: 2, oldest: 10 }] }, { rows: [] })
		expect(await posts.creationWindow('usr_1', new Date(0))).toEqual({
			count: 2,
			oldest: new Date(10),
		})
		expect(await posts.creationWindow('usr_1', new Date(0))).toEqual({ count: 0, oldest: null })
	})
	it('creates a text post with its atomic rate guard', async () => {
		const { d1, posts } = setup()
		d1.respond({ changes: 1 })
		await posts.create(
			'pst_1',
			'usr_1',
			{ type: 'post', caption: 'Hello', mediaIds: [] },
			new Date(10),
		)
		expect(d1.batches).toEqual([1])
	})
	it.each(['post', 'reel'] as const)(
		'atomically attaches %s media with a readiness guard',
		async (type) => {
			const { d1, posts } = setup()
			d1.respond({ changes: 1 }, { changes: 1 }, { changes: 1 })
			await posts.create('pst_1', 'usr_1', { type, caption: '', mediaIds: ['med_1'] }, new Date(10))
			expect(d1.batches).toEqual([3])
			expect(d1.calls[1].values).toEqual(['med_1', 0, 'pst_1'])
		},
	)
	it.each([0, 30])('maps atomic creation failure with window count %s', async (count) => {
		const { d1, posts } = setup()
		d1.respond({ changes: 0 }, { rows: [{ count, oldest: null }] })
		await expect(
			posts.create(
				'pst_1',
				'usr_1',
				{ type: 'post', caption: 'Hello', mediaIds: [] },
				new Date(10),
			),
		).rejects.toMatchObject({ code: count === 30 ? 'RATE_LIMITED' : 'VALIDATION_FAILED' })
	})
	it('batches caption history with editing and soft-deletes posts', async () => {
		const { d1, posts } = setup()
		d1.respond({ changes: 1 }, { changes: 1 }, { changes: 1 })
		await posts.update('pst_1', 'Edited', new Date(10))
		await posts.delete('pst_1', new Date(20))
		expect(d1.batches).toEqual([2])
		expect(d1.calls[2].values).toEqual([20, 'pst_1'])
	})
	it.each(['like', 'save'] as const)(
		'reports actual %s insertion, never repeated or removal writes',
		async (kind) => {
			const { d1, posts } = setup()
			for (const changes of [1, 0, 1]) {
				d1.respond({ changes })
				if (kind === 'like') d1.respond({ changes: 1 })
			}
			expect(await posts.react('pst_1', 'usr_1', kind, true, new Date(10))).toBe(true)
			expect(await posts.react('pst_1', 'usr_1', kind, true, new Date(10))).toBe(false)
			expect(await posts.react('pst_1', 'usr_1', kind, false, new Date(10))).toBe(false)
		},
	)
})

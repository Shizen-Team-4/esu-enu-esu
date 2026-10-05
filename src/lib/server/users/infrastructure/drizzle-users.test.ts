import { afterEach, describe, expect, it, vi } from 'vitest'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../db/schema'
import { ScriptedD1 } from '../../shared/testing/scripted-d1'
import { createUserRepository } from './drizzle-users'

const row = {
	id: 'usr_2',
	username: 'dara',
	name: 'Dara',
	image: null,
	bio: '',
	email: 'dara@example.com',
	emailVerified: 1,
	createdAt: 10,
	posts: 1,
	followers: 2,
	following: 3,
	viewerFollowing: 1,
	followedAt: 10,
	rank: 1,
}
function setup() {
	const d1 = new ScriptedD1()
	return { d1, users: createUserRepository(drizzle(d1, { schema })) }
}
afterEach(() => {
	vi.useRealTimers()
})
describe('user persistence', () => {
	it('finds by ID and maps the contract shape', async () => {
		const { d1, users } = setup()
		d1.respond({ rows: [row] })
		expect(await users.find({ id: 'usr_2' }, 'usr_2')).toMatchObject({
			displayName: 'Dara',
			counts: { posts: 1, followers: 2, following: 3 },
			viewer: { isMe: true, following: true },
			emailVerified: true,
		})
	})
	it('finds by username and handles missing or incomplete profiles', async () => {
		const { d1, users } = setup()
		d1.respond(
			{ rows: [{ ...row, username: null, emailVerified: 0, viewerFollowing: 0 }] },
			{ rows: [] },
		)
		expect(await users.find({ username: 'dara' }, null)).toMatchObject({
			username: '',
			emailVerified: false,
			viewer: { isMe: false, following: false },
		})
		expect(await users.find({ username: 'missing' }, null)).toBeNull()
	})
	it('searches with ranking and an opaque continuation', async () => {
		const { d1, users } = setup()
		d1.respond({ rows: [row, { ...row, id: 'usr_3' }] })
		const result = await users.search('da', 'usr_1', 1)
		expect(result.items).toMatchObject([{ username: 'dara' }])
		expect(result.nextCursor).not.toBeNull()
	})
	it('applies rank and username cursor boundaries', async () => {
		const { d1, users } = setup()
		d1.respond({ rows: [] })
		expect(await users.search('da', null, 20, { time: 1, id: '64617261_usr_2' })).toEqual({
			items: [],
			nextCursor: null,
		})
		expect(d1.calls[0].values).toContain('dara')
	})
	it('handles a short legacy cursor and incomplete final search row', async () => {
		const { d1, users } = setup()
		d1.respond({ rows: [{ ...row, username: null }] })
		expect((await users.search('da', null, 20, { time: 0, id: '_usr_2' })).nextCursor).toBeNull()
	})
	it('only reports newly inserted follows, not repeated requests or unfollows', async () => {
		const { d1, users } = setup()
		d1.respond(
			{ changes: 1 },
			{ rows: [{ count: 1 }] },
			{ changes: 0 },
			{ rows: [{ count: 1 }] },
			{ changes: 1 },
			{ rows: [] },
		)
		expect(await users.follow('usr_1', 'usr_2', true, new Date(10))).toEqual({
			followers: 1,
			created: true,
		})
		expect(await users.follow('usr_1', 'usr_2', true, new Date(10))).toEqual({
			followers: 1,
			created: false,
		})
		expect(await users.follow('usr_1', 'usr_2', false, new Date(10))).toEqual({
			followers: 0,
			created: false,
		})
	})
	it.each(['followers', 'following'] as const)(
		'paginates %s with viewer state and stable tie-breakers',
		async (kind) => {
			const { d1, users } = setup()
			d1.respond({ rows: [row, { ...row, id: 'usr_3' }] }, { rows: [] })
			const list = kind === 'followers' ? users.listFollowers : users.listFollowing
			const first = await list('usr_1', 'usr_2', { limit: 1, cursor: { time: 20, id: 'usr_4' } })
			expect(first.items).toMatchObject([{ viewer: { isMe: true, following: true } }])
			expect(first.nextCursor).not.toBeNull()
			expect(await list('usr_1', null, { limit: 20 })).toEqual({ items: [], nextCursor: null })
		},
	)
	it('checks username uniqueness', async () => {
		const { d1, users } = setup()
		d1.respond({ rows: [{ id: 'usr_3' }] }, { rows: [] })
		expect(await users.isUsernameTaken('dara', 'usr_1')).toBe(true)
		expect(await users.isUsernameTaken('other', 'usr_1')).toBe(false)
	})
	it('updates selected fields and sets or removes avatars', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(10))
		const { d1, users } = setup()
		d1.respond({ changes: 1 }, { changes: 1 })
		await users.update('usr_1', {
			username: 'new_name',
			displayName: 'New Name',
			bio: 'New bio',
			avatar: { mediaId: 'med_1', url: 'https://example.com/avatar' },
		})
		expect(d1.calls[0].values).toContain('med_1')
		await users.update('usr_1', { avatar: null })
		expect(d1.calls[1].values).toContain(null)
	})
	it('maps unique conflicts and preserves unexpected errors', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(10))
		const { d1, users } = setup()
		d1.respond(
			{ error: new Error('UNIQUE constraint failed: user.username') },
			{ error: new Error('offline') },
		)
		await expect(users.update('usr_1', { username: 'dara' })).rejects.toMatchObject({
			code: 'CONFLICT',
		})
		await expect(users.update('usr_1', {})).rejects.toThrow()
	})
})

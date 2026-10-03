import { describe, expect, it } from 'vitest'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { listFollowers } from './list-followers'
import { listFollowing } from './list-following'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

const users = () =>
	new InMemoryUserRepository({
		users: [
			aUser({ id: viewer.id, username: 'owner' }),
			aUser({ id: otherViewer.id, username: 'two' }),
			aUser({ id: 'usr_3', username: 'three' }),
			aUser({ id: 'usr_4', username: '' }),
		],
		follows: [
			['usr_2', 'usr_1'],
			['usr_3', 'usr_1'],
			['usr_4', 'usr_1'],
			['usr_1', 'usr_2'],
			['usr_1', 'usr_3'],
		],
	})

describe('listFollowers', () => {
	it('lists followers newest first with the viewer flags', async () => {
		const page = await listFollowers(users())(otherViewer, { username: 'owner' })

		expect(page.nextCursor).toBeNull()
		expect(page.items.map((item) => item.username)).toEqual(['three', 'two'])
		expect(page.items[1].viewer).toEqual({ isMe: true, following: false })
		expect(page.items[0].viewer).toEqual({ isMe: false, following: false })
	})

	it('works for a logged-out viewer', async () => {
		const page = await listFollowers(users())(null, { username: 'owner' })

		expect(page.items.every((item) => !item.viewer.isMe && !item.viewer.following)).toBe(true)
	})

	it('pages with a cursor', async () => {
		const repo = users()
		const first = await listFollowers(repo)(null, { username: 'owner', limit: 1 })
		const second = await listFollowers(repo)(null, {
			username: 'owner',
			limit: 1,
			cursor: first.nextCursor!,
		})

		expect(first.items.map((item) => item.username)).toEqual(['three'])
		expect(second.items.map((item) => item.username)).toEqual(['two'])
		expect(second.nextCursor).toBeNull()
	})

	it('reports an unknown username', async () => {
		await expect(listFollowers(users())(null, { username: 'ghost' })).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports a user without a username as not found', async () => {
		await expect(listFollowers(users())(null, { username: '' })).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('rejects a bad cursor', async () => {
		await expect(
			listFollowers(users())(null, { username: 'owner', cursor: '***' }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fields: { cursor: 'INVALID_FORMAT' } })
	})

	it.each([0, 51, 'x'])('rejects the limit %j', async (limit) => {
		await expect(listFollowers(users())(null, { username: 'owner', limit })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { limit: 'INVALID_FORMAT' },
		})
	})
})

describe('listFollowing', () => {
	it('lists who the user follows newest first', async () => {
		const page = await listFollowing(users())(viewer, { username: 'owner' })

		expect(page.items.map((item) => item.username)).toEqual(['three', 'two'])
		expect(page.items[0].viewer.following).toBe(true)
	})

	it('reports an unknown username', async () => {
		await expect(listFollowing(users())(null, { username: 'ghost' })).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
})

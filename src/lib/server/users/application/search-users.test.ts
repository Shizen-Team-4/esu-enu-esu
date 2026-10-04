import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { searchUsers } from './search-users'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

const setup = () =>
	new InMemoryUserRepository({
		users: [
			aUser({ id: 'usr_2', username: 'dara', displayName: 'Dara' }),
			aUser({ id: 'usr_3', username: 'dark', displayName: 'Dark' }),
			aUser({ id: 'usr_4', username: 'dar', displayName: 'Other' }),
			aUser({ id: 'usr_5', username: 'kenji', displayName: 'Darkroom' }),
			aUser({ id: 'usr_6', username: '', displayName: 'Dar' }),
			aUser({ id: 'usr_7', username: 'zed', displayName: 'Zed' }),
		],
		follows: [[viewer.id, 'usr_3']],
	})

const names = (page: { items: { username: string }[] }) => page.items.map((i) => i.username)

describe('searchUsers', () => {
	it('ranks the exact match, then followed users, then the rest', async () => {
		const page = await searchUsers(setup())(viewer, { q: 'dar' })

		expect(names(page)).toEqual(['dar', 'dark', 'dara', 'kenji'])
	})

	it('trims and lowercases the query', async () => {
		const page = await searchUsers(setup())(viewer, { q: '  DAR  ' })

		expect(names(page)).toContain('dar')
	})

	it('matches display names and skips users without a username', async () => {
		const page = await searchUsers(setup())(viewer, { q: 'darkroom' })

		expect(names(page)).toEqual(['kenji'])
	})

	it('reports whether the viewer follows each result', async () => {
		const page = await searchUsers(setup())(viewer, { q: 'dark' })

		expect(page.items[0]).toMatchObject({ username: 'dark', viewer: { following: true } })
	})

	it('works for a logged-out visitor', async () => {
		const page = await searchUsers(setup())(null, { q: 'zed' })

		expect(page.items[0]).toMatchObject({ viewer: { isMe: false, following: false } })
	})

	it('pages results with a cursor', async () => {
		const deps = setup()
		const first = await searchUsers(deps)(viewer, { q: 'dar', limit: 2 })
		const second = await searchUsers(deps)(viewer, {
			q: 'dar',
			limit: 2,
			cursor: first.nextCursor!,
		})

		expect([names(first), names(second)]).toEqual([
			['dar', 'dark'],
			['dara', 'kenji'],
		])
		expect(second.nextCursor).toBeNull()
	})

	it.each([undefined, 5, '', '   '])('rejects a missing or empty query (%j)', async (q) => {
		await expect(searchUsers(setup())(viewer, { q })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { q: 'INVALID_FORMAT' },
		})
	})

	it('rejects a query longer than 50 characters', async () => {
		await expect(searchUsers(setup())(viewer, { q: 'a'.repeat(51) })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('accepts a query of exactly 50 characters', async () => {
		const page = await searchUsers(setup())(viewer, { q: 'a'.repeat(50) })

		expect(page.items).toEqual([])
	})

	it('rejects an invalid limit', async () => {
		await expect(searchUsers(setup())(viewer, { q: 'dar', limit: 51 })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { limit: 'INVALID_FORMAT' },
		})
	})

	it('rejects a malformed cursor', async () => {
		await expect(searchUsers(setup())(viewer, { q: 'dar', cursor: '***' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { cursor: 'INVALID_FORMAT' },
		})
	})
})

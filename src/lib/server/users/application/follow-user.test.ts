import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { followUser } from './follow-user'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

const setup = () => ({
	users: new InMemoryUserRepository({
		users: [aUser({ id: viewer.id }), aUser({ id: otherViewer.id, username: 'dara' })],
	}),
	clock: fixedClock(),
})

describe('followUser', () => {
	it('follows a user and returns the follower count', async () => {
		expect(await followUser(setup())(viewer, 'dara')).toEqual({ following: true, followers: 1 })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await followUser(deps)(viewer, 'dara')

		expect(await followUser(deps)(viewer, 'dara')).toEqual({ following: true, followers: 1 })
	})

	it('unfollows a user', async () => {
		const deps = setup()
		await followUser(deps)(viewer, 'dara')

		expect(await followUser(deps)(viewer, 'dara', false)).toEqual({
			following: false,
			followers: 0,
		})
	})

	it('rejects following yourself', async () => {
		await expect(followUser(setup())(viewer, viewer.id)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { username: 'NOT_ALLOWED' },
		})
	})

	it('reports an unknown user', async () => {
		await expect(followUser(setup())(viewer, 'nobody')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(followUser(setup())(null, 'dara')).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

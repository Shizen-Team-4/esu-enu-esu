import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { getProfile } from './get-profile'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

const setup = () =>
	new InMemoryUserRepository({
		users: [aUser({ id: 'usr_2', username: 'dara' }), aUser({ id: 'usr_3', username: '' })],
		follows: [[viewer.id, 'usr_2']],
	})

describe('getProfile', () => {
	it('returns the public profile without email fields', async () => {
		const profile = await getProfile(setup())(viewer, 'dara')

		expect(profile).toMatchObject({ id: 'usr_2', username: 'dara', viewer: { following: true } })
		expect(profile).not.toHaveProperty('email')
		expect(profile).not.toHaveProperty('emailVerified')
	})

	it('works for a logged-out visitor', async () => {
		expect(await getProfile(setup())(null, 'dara')).toMatchObject({
			viewer: { isMe: false, following: false },
		})
	})

	it('reports when the profile follows the viewer', async () => {
		const profile = await getProfile(
			new InMemoryUserRepository({
				users: [aUser({ id: 'usr_2', username: 'dara' })],
				follows: [['usr_2', viewer.id]],
			}),
		)(viewer, 'dara')

		expect(profile.viewer.followsViewer).toBe(true)
	})

	it('reports an unknown username', async () => {
		await expect(getProfile(setup())(viewer, 'nobody')).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('reports an empty username as missing', async () => {
		await expect(getProfile(setup())(viewer, '')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})
})

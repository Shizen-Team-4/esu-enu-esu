import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { getMe } from './get-me'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

describe('getMe', () => {
	it('returns the viewer account including private fields', async () => {
		const users = new InMemoryUserRepository({ users: [aUser({ id: viewer.id })] })

		expect(await getMe(users)(viewer)).toMatchObject({
			id: viewer.id,
			email: 'usr_1@example.com',
			emailVerified: true,
			viewer: { isMe: true, following: false },
		})
	})

	it('reports a missing account', async () => {
		await expect(getMe(new InMemoryUserRepository())(viewer)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})

	it('requires a viewer', async () => {
		await expect(getMe(new InMemoryUserRepository())(null)).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
})

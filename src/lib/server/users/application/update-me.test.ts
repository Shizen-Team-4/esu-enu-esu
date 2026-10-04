import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { updateMe } from './update-me'
import { InMemoryAvatarMedia } from './testing/in-memory-avatar-media'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

function setup() {
	const users = new InMemoryUserRepository({
		users: [
			aUser({ id: viewer.id, username: 'mine', avatarUrl: '/media/old.png' }),
			aUser({ id: 'usr_2', username: 'taken' }),
		],
	})
	const avatars = new InMemoryAvatarMedia([
		{ id: 'med_mine', ownerId: viewer.id, url: '/media/new.png' },
		{ id: 'med_other', ownerId: 'usr_2', url: '/media/other.png' },
	])
	return { users, run: updateMe({ users, avatars }) }
}

describe('updateMe', () => {
	it('updates the provided fields and returns the account', async () => {
		const { run } = setup()

		const me = await run(viewer, { displayName: ' Mia ', bio: 'hello', username: 'mia_1' })

		expect(me).toMatchObject({
			displayName: 'Mia',
			bio: 'hello',
			username: 'mia_1',
			email: 'usr_1@example.com',
			viewer: { isMe: true },
		})
	})

	it('leaves fields that were not provided untouched', async () => {
		const { run } = setup()

		const me = await run(viewer, { bio: 'only bio' })

		expect(me).toMatchObject({ username: 'mine', displayName: 'usr_1', bio: 'only bio' })
	})

	it('accepts an empty patch without changes', async () => {
		const { run } = setup()

		expect(await run(viewer, {})).toMatchObject({ username: 'mine', bio: '' })
	})

	it('lets a user keep their own username', async () => {
		const { run } = setup()

		expect(await run(viewer, { username: 'mine' })).toMatchObject({ username: 'mine' })
	})

	it('sets the avatar from an own ready upload', async () => {
		const { run } = setup()

		expect((await run(viewer, { avatarMediaId: 'med_mine' })).avatarUrl).toBe('/media/new.png')
	})

	it('removes the avatar when avatarMediaId is null', async () => {
		const { run } = setup()

		expect((await run(viewer, { avatarMediaId: null })).avatarUrl).toBeNull()
	})

	it.each(['med_other', 'med_missing'])('rejects the unusable avatar %s', async (id) => {
		const { run } = setup()

		await expect(run(viewer, { avatarMediaId: id })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { avatarMediaId: 'INVALID_FORMAT' },
		})
	})

	it('rejects invalid input with field codes', async () => {
		const { run } = setup()

		await expect(run(viewer, { username: 'X' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { username: 'TOO_SHORT' },
		})
	})

	it('reports a username taken by someone else', async () => {
		const { run } = setup()

		await expect(run(viewer, { username: 'taken' })).rejects.toMatchObject({
			code: 'CONFLICT',
			fields: { username: 'TAKEN' },
		})
	})

	it('reports a username taken between the check and the write', async () => {
		const { users, run } = setup()
		users.raceUsername = 'racer'

		await expect(run(viewer, { username: 'racer' })).rejects.toMatchObject({
			code: 'CONFLICT',
			fields: { username: 'TAKEN' },
		})
	})

	it('reports a missing account', async () => {
		const users = new InMemoryUserRepository()

		await expect(
			updateMe({ users, avatars: new InMemoryAvatarMedia() })(viewer, {}),
		).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		const { run } = setup()

		await expect(run(null, {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
})

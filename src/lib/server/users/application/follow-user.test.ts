import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { otherViewer, viewer } from '../../shared/testing/viewer'
import { followUser } from './follow-user'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'
import { RecordingNotifier } from '../../shared/testing/recording-notifier'

const setup = () => ({
	users: new InMemoryUserRepository({
		users: [aUser({ id: viewer.id }), aUser({ id: otherViewer.id, username: 'dara' })],
	}),
	clock: fixedClock(),
	notifier: new RecordingNotifier(),
})

describe('followUser', () => {
	it('follows a user and returns the follower count', async () => {
		expect(await followUser(setup())(viewer, 'dara')).toEqual({ following: true, followers: 1 })
	})

	it('is idempotent when repeated', async () => {
		const deps = setup()
		await followUser(deps)(viewer, 'dara')

		expect(await followUser(deps)(viewer, 'dara')).toEqual({ following: true, followers: 1 })
		expect(deps.notifier.events).toEqual([
			{
				type: 'follow',
				actorId: viewer.id,
				recipientId: otherViewer.id,
				createdAt: deps.clock.now(),
			},
		])
	})

	it('unfollows a user', async () => {
		const deps = setup()
		await followUser(deps)(viewer, 'dara')
		const before = deps.notifier.events.length

		expect(await followUser(deps)(viewer, 'dara', false)).toEqual({
			following: false,
			followers: 0,
		})
		expect(deps.notifier.events).toHaveLength(before)
	})

	it('does not notify for a relationship that predates deployment', async () => {
		const deps = setup()
		await deps.users.follow(viewer.id, otherViewer.id, true)
		await followUser(deps)(viewer, 'dara')
		expect(deps.notifier.events).toEqual([])
	})

	it('does not notify after a rejected follow write', async () => {
		const deps = setup()
		deps.users.follow = async () => {
			throw new Error('write failed')
		}
		await expect(followUser(deps)(viewer, 'dara')).rejects.toThrow('write failed')
		expect(deps.notifier.events).toEqual([])
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

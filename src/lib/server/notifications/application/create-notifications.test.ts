import { describe, expect, it } from 'vitest'
import { sequentialIds } from '../../shared/testing/sequential-ids'
import { createNotifications } from './create-notifications'
import { InMemoryNotifications } from './testing/in-memory-notifications'

const createdAt = new Date('2026-10-03T00:00:00Z')
function setup() {
	const notifications = new InMemoryNotifications()
	const queries: [string, Date][] = []
	const followers = {
		listIds: async (id: string, time: Date) => {
			queries.push([id, time])
			return ['usr_1', 'usr_2', 'usr_3']
		},
	}
	return { notifications, queries, followers, ids: sequentialIds() }
}

describe('createNotifications', () => {
	it('fans out posts with generated identifiers and injected publication time', async () => {
		const deps = setup()
		await createNotifications(deps)({ type: 'post', actorId: 'usr_1', postId: 'pst_1', createdAt })
		expect(deps.queries).toEqual([['usr_1', createdAt]])
		expect(deps.notifications.rows).toMatchObject([
			{ id: 'ntf_1', recipientId: 'usr_2' },
			{ id: 'ntf_2', recipientId: 'usr_3' },
		])
	})
	it('does not query followers for likes and deduplicates repeated delivery', async () => {
		const deps = setup()
		const event = {
			type: 'like' as const,
			actorId: 'usr_1',
			postId: 'pst_1',
			recipientId: 'usr_2',
			createdAt,
		}
		await createNotifications(deps)(event)
		await createNotifications(deps)(event)
		expect(deps.queries).toEqual([])
		expect(deps.notifications.rows).toHaveLength(1)
	})
	it('does not write when no recipients remain', async () => {
		const deps = setup()
		await createNotifications(deps)({
			type: 'follow',
			actorId: 'usr_1',
			recipientId: 'usr_1',
			createdAt,
		})
		expect(deps.notifications.rows).toHaveLength(0)
	})
	it('propagates follower lookup failure to the background delivery adapter', async () => {
		const deps = setup()
		deps.followers.listIds = async () => {
			throw new Error('lookup failed')
		}
		await expect(
			createNotifications(deps)({ type: 'post', actorId: 'usr_1', postId: 'pst_1', createdAt }),
		).rejects.toThrow('lookup failed')
	})
	it('propagates persistence failure to the background delivery adapter', async () => {
		const deps = setup()
		deps.notifications.create = async () => {
			throw new Error('write failed')
		}
		await expect(
			createNotifications(deps)({
				type: 'follow',
				actorId: 'usr_1',
				recipientId: 'usr_2',
				createdAt,
			}),
		).rejects.toThrow('write failed')
	})
})

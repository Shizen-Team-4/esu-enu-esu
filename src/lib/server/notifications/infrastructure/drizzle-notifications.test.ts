import { describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../db/schema'
import { ScriptedD1 } from '../../shared/testing/scripted-d1'
import { notificationRecipients } from '../domain/notification'
import { createNotificationRepository } from './drizzle-notifications'
import { createNotificationFollowers } from './drizzle-notification-followers'

const row = {
	id: 'ntf_2',
	type: 'like',
	actorId: 'usr_2',
	username: 'dara',
	name: 'Dara',
	image: null,
	postId: 'pst_1',
	postType: 'post',
	commentId: null,
	createdAt: 10,
	readAt: null,
}
function setup() {
	const d1 = new ScriptedD1()
	const db = drizzle(d1, { schema })
	return {
		d1,
		notifications: createNotificationRepository(db, d1),
		followers: createNotificationFollowers(db),
	}
}
describe('notification persistence', () => {
	it('persists fan-out in bounded batches with a dedupe conflict guard', async () => {
		const { d1, notifications } = setup()
		const drafts = notificationRecipients(
			{ type: 'post', actorId: 'usr_1', postId: 'pst_1', createdAt: new Date(10) },
			Array.from({ length: 11 }, (_, i) => `usr_${i + 2}`),
		).map((draft, i) => ({ ...draft, id: `ntf_${i}` }))
		d1.respond(...drafts.map(() => ({ changes: 1 })))
		await notifications.create(drafts)
		expect(d1.batches).toEqual([10, 1])
		expect(d1.calls[0].sql).toContain('ON CONFLICT(dedupe_key) DO NOTHING')
		expect(d1.calls[0].values).toEqual([
			'ntf_0',
			'post',
			'usr_1',
			'pst_1',
			null,
			'post:pst_1:usr_2',
			10,
			'usr_2',
		])
	})
	it('does not run an empty batch', async () => {
		const { d1, notifications } = setup()
		await notifications.create([])
		expect(d1.calls).toEqual([])
	})
	it('scopes pagination to a recipient and hides unavailable content in joins', async () => {
		const { d1, notifications } = setup()
		d1.respond({ rows: [row, { ...row, id: 'ntf_1' }] })
		const page = await notifications.list('usr_1', { limit: 1 })
		expect(page.items[0]).toMatchObject({ id: 'ntf_2', actor: { username: 'dara' } })
		expect(page.nextCursor).not.toBeNull()
		expect(d1.calls[0].sql).toContain('n.recipient_id = ?')
		expect(d1.calls[0].sql).toContain('p.deleted_at IS NULL')
		expect(d1.calls[0].sql).toContain('a.banned = 0')
		expect(d1.calls[0].values).toEqual(['usr_1', 2])
	})
	it('binds timestamp and ID cursor boundaries', async () => {
		const { d1, notifications } = setup()
		d1.respond({ rows: [row] })
		expect(
			(await notifications.list('usr_1', { limit: 20, cursor: { time: 10, id: 'ntf_3' } }))
				.nextCursor,
		).toBeNull()
		expect(d1.calls[0].values).toEqual(['usr_1', 10, 10, 'ntf_3', 21])
	})
	it('returns an empty page without a cursor', async () => {
		const { d1, notifications } = setup()
		d1.respond({ rows: [] })
		expect(await notifications.list('usr_1', { limit: 20 })).toEqual({
			items: [],
			nextCursor: null,
		})
	})
	it('counts only recipient unread entries', async () => {
		const { d1, notifications } = setup()
		d1.respond({ rows: [{ count: 4 }] }, { rows: [] })
		expect(await notifications.unreadCount('usr_1')).toBe(4)
		expect(d1.calls[0].sql).toContain('read_at IS NULL')
		expect(d1.calls[0].values).toEqual(['usr_1'])
		expect(await notifications.unreadCount('usr_1')).toBe(0)
	})
	it('preserves the first read timestamp and returns the available destination', async () => {
		const { d1, notifications } = setup()
		d1.respond({ changes: 1 }, { rows: [{ ...row, readAt: 20 }] })
		expect(await notifications.markRead('usr_1', 'ntf_2', new Date(20))).toMatchObject({
			readAt: '1970-01-01T00:00:00.020Z',
		})
		expect(d1.calls[0].sql).toContain('COALESCE(read_at, ?)')
		expect(d1.calls[0].values).toEqual([20, 'ntf_2', 'usr_1'])
		expect(d1.calls[1].values).toEqual(['ntf_2', 'usr_1'])
	})
	it('does not reveal missing or other-user entries', async () => {
		const { d1, notifications } = setup()
		d1.respond({ changes: 0 })
		expect(await notifications.markRead('usr_1', 'ntf_2', new Date(20))).toBeNull()
		expect(d1.calls).toHaveLength(1)
	})
	it('handles deletion between read and hydration', async () => {
		const { d1, notifications } = setup()
		d1.respond({ changes: 1 }, { rows: [] })
		expect(await notifications.markRead('usr_1', 'ntf_2', new Date(20))).toBeNull()
	})
	it('marks only current recipient unread entries', async () => {
		const { d1, notifications } = setup()
		d1.respond({ changes: 2 })
		await notifications.markAllRead('usr_1', new Date(20))
		expect(d1.calls[0].sql).toContain('recipient_id = ? AND read_at IS NULL')
		expect(d1.calls[0].values).toEqual([20, 'usr_1'])
	})
	it('looks up eligible followers at publication time', async () => {
		const { d1, followers } = setup()
		d1.respond({ rows: [{ id: 'usr_2' }] })
		expect(await followers.listIds('usr_1', new Date(10))).toEqual(['usr_2'])
		expect(d1.calls[0].sql).toContain('f.created_at <= ?')
		expect(d1.calls[0].sql).toContain('u.banned = 0')
		expect(d1.calls[0].values).toEqual(['usr_1', 10])
	})
})

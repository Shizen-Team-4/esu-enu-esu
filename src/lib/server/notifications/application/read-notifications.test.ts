import { describe, expect, it } from 'vitest'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer, otherViewer } from '../../shared/testing/viewer'
import { encodeCursor } from '../../shared/domain/cursor'
import { listNotifications } from './list-notifications'
import { getUnreadCount } from './get-unread-count'
import { markNotificationRead } from './mark-notification-read'
import { markAllNotificationsRead } from './mark-all-notifications-read'
import { aNotification, InMemoryNotifications } from './testing/in-memory-notifications'

function setup() {
	const notifications = new InMemoryNotifications()
	notifications.rows = [1, 2, 3].map((id) => ({
		...aNotification({ id: `ntf_${id}` }),
		recipientId: id === 3 ? otherViewer.id : viewer.id,
		dedupeKey: `${id}`,
	}))
	return { notifications, clock: fixedClock() }
}

describe('listNotifications', () => {
	it('only returns the signed-in recipient and paginates equal timestamps by ID', async () => {
		const { notifications } = setup()
		const first = await listNotifications(notifications)(viewer, { limit: 1 })
		expect(first.items.map((item) => item.id)).toEqual(['ntf_2'])
		const second = await listNotifications(notifications)(viewer, {
			limit: 1,
			cursor: first.nextCursor!,
		})
		expect(second.items.map((item) => item.id)).toEqual(['ntf_1'])
		expect(second.nextCursor).toBeNull()
	})
	it('defaults to twenty entries and returns an empty page at the end', async () => {
		const { notifications } = setup()
		expect((await listNotifications(notifications)(viewer)).items).toHaveLength(2)
		expect(
			await listNotifications(notifications)(viewer, {
				cursor: encodeCursor({ time: 0, id: 'ntf_0' }),
			}),
		).toEqual({ items: [], nextCursor: null })
	})
	it.each([{ cursor: '' }, { cursor: 'bad' }, { limit: 0 }, { limit: 51 }])(
		'validates pagination %j',
		async (input) => {
			await expect(listNotifications(setup().notifications)(viewer, input)).rejects.toMatchObject({
				code: 'VALIDATION_FAILED',
			})
		},
	)
})

describe('notification read state', () => {
	it('counts only the current user unread entries', async () => {
		const deps = setup()
		expect(await getUnreadCount(deps.notifications)(viewer)).toEqual({ unreadCount: 2 })
		await markNotificationRead(deps)(viewer, 'ntf_1')
		expect(await getUnreadCount(deps.notifications)(viewer)).toEqual({ unreadCount: 1 })
	})
	it('marks one read and preserves its first read time', async () => {
		const deps = setup()
		const first = await markNotificationRead(deps)(viewer, 'ntf_1')
		expect(first.readAt).toBe(deps.clock.now().toISOString())
		const later = { ...deps, clock: fixedClock('2026-10-04T00:00:00Z') }
		expect((await markNotificationRead(later)(viewer, 'ntf_1')).readAt).toBe(first.readAt)
	})
	it.each(['ntf_3', 'ntf_missing'])('hides another recipient or missing entry %s', async (id) => {
		await expect(markNotificationRead(setup())(viewer, id)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
	it('validates the mark-read identifier', async () => {
		await expect(markNotificationRead(setup())(viewer, 'pst_1')).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
	it('marks all current recipient entries without affecting someone else', async () => {
		const deps = setup()
		await markAllNotificationsRead(deps)(viewer)
		await markAllNotificationsRead(deps)(viewer)
		expect(await getUnreadCount(deps.notifications)(viewer)).toEqual({ unreadCount: 0 })
		expect(await getUnreadCount(deps.notifications)(otherViewer)).toEqual({ unreadCount: 1 })
	})
	it.each(['list', 'count', 'read', 'all'] as const)(
		'requires authentication for %s',
		async (operation) => {
			const deps = setup()
			const actions = {
				list: () => listNotifications(deps.notifications)(null),
				count: () => getUnreadCount(deps.notifications)(null),
				read: () => markNotificationRead(deps)(null, 'ntf_1'),
				all: () => markAllNotificationsRead(deps)(null),
			}
			await expect(actions[operation]()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
		},
	)
	it.each(['list', 'count', 'read', 'all'] as const)(
		'propagates persistence failures for %s',
		async (operation) => {
			const deps = setup()
			const fail = async () => {
				throw new Error('offline')
			}
			const actions = {
				list: () => {
					deps.notifications.list = fail
					return listNotifications(deps.notifications)(viewer)
				},
				count: () => {
					deps.notifications.unreadCount = fail
					return getUnreadCount(deps.notifications)(viewer)
				},
				read: () => {
					deps.notifications.markRead = fail
					return markNotificationRead(deps)(viewer, 'ntf_1')
				},
				all: () => {
					deps.notifications.markAllRead = fail
					return markAllNotificationsRead(deps)(viewer)
				},
			}
			await expect(actions[operation]()).rejects.toThrow('offline')
		},
	)
})

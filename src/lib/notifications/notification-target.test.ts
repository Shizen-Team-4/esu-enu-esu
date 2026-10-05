import { describe, expect, it } from 'vitest'
import { aNotification } from '$lib/server/notifications/application/testing/in-memory-notifications'
import { notificationTarget } from './notification-target'
// cspell:ignore Fexample

describe('notificationTarget', () => {
	it('opens a post or reel through the existing post route', () => {
		expect(notificationTarget(aNotification())).toBe('/p/pst_1')
		expect(notificationTarget(aNotification({ post: { id: 'pst_1', type: 'reel' } }))).toBe(
			'/p/pst_1',
		)
	})
	it('opens comments at the comment section', () => {
		expect(notificationTarget(aNotification({ commentId: 'cmt_1' }))).toBe('/p/pst_1#comments')
	})
	it('opens a follower profile', () => {
		expect(notificationTarget(aNotification({ type: 'follow' }))).toBe('/u/dara')
	})
	it('does not construct a broken link to an unavailable post or actor', () => {
		expect(notificationTarget(aNotification({ post: null }))).toBeNull()
		expect(notificationTarget(aNotification({ type: 'follow', actor: null }))).toBeNull()
	})
	it('encodes destination segments instead of permitting redirects', () => {
		const notification = aNotification()
		notification.actor!.username = '//example.com'
		expect(notificationTarget({ ...notification, type: 'follow' })).toBe('/u/%2F%2Fexample.com')
		expect(
			notificationTarget({ ...notification, post: { id: '//example.com', type: 'post' } }),
		).toBe('/p/%2F%2Fexample.com')
	})
})

import { describe, expect, it } from 'vitest'
import { toNotification, type NotificationRow } from './notification-mapper'

const row: NotificationRow = {
	id: 'ntf_1',
	type: 'reply',
	actorId: 'usr_2',
	username: 'dara',
	name: 'Dara',
	image: 'https://example.com/avatar',
	postId: 'pst_1',
	postType: 'reel',
	commentId: 'cmt_1',
	createdAt: 0,
	readAt: null,
}
describe('toNotification', () => {
	it('maps actor, reel, comment and UTC timestamp without leaking storage fields', () => {
		expect(toNotification(row)).toEqual({
			id: 'ntf_1',
			type: 'reply',
			actor: { id: 'usr_2', username: 'dara', displayName: 'Dara', avatarUrl: row.image },
			post: { id: 'pst_1', type: 'reel' },
			commentId: 'cmt_1',
			createdAt: '1970-01-01T00:00:00.000Z',
			readAt: null,
		})
	})
	it('maps zero read timestamp rather than treating it as unread', () => {
		expect(toNotification({ ...row, readAt: 0 }).readAt).toBe('1970-01-01T00:00:00.000Z')
	})
	it('keeps history without exposing unavailable actors or content', () => {
		expect(toNotification({ ...row, actorId: null, postId: null })).toMatchObject({
			actor: null,
			post: null,
			commentId: null,
		})
	})
	it.each([{ username: null }, { name: null }, { actorId: null }])(
		'uses an unavailable actor for incomplete data %j',
		(patch) => {
			expect(toNotification({ ...row, ...patch }).actor).toBeNull()
		},
	)
	it('keeps an available post when only its comment was deleted', () => {
		expect(toNotification({ ...row, commentId: null })).toMatchObject({
			post: { id: 'pst_1' },
			commentId: null,
		})
	})
	it('does not construct a post without a type', () => {
		expect(toNotification({ ...row, postType: null }).post).toBeNull()
	})
})

import { describe, expect, it } from 'vitest'
import type { NotificationEvent } from '../../shared/application/notifier'
import { notificationRecipients, validateNotificationId } from './notification'

const createdAt = new Date('2026-10-03T00:00:00Z')
const comment: NotificationEvent = {
	type: 'comment',
	actorId: 'usr_1',
	postId: 'pst_1',
	commentId: 'cmt_1',
	postAuthorId: 'usr_2',
	replyAuthorId: null,
	createdAt,
}

describe('notificationRecipients', () => {
	it('notifies each follower once without notifying the author', () => {
		const drafts = notificationRecipients(
			{ type: 'post', actorId: 'usr_1', postId: 'pst_1', createdAt },
			['usr_1', 'usr_2', 'usr_2', 'usr_3'],
		)
		expect(drafts.map((draft) => draft.recipientId)).toEqual(['usr_2', 'usr_3'])
		expect(drafts[0]).toMatchObject({
			type: 'post',
			postId: 'pst_1',
			commentId: null,
			dedupeKey: 'post:pst_1:usr_2',
			createdAt,
		})
	})
	it('handles a post without followers', () => {
		expect(
			notificationRecipients({ type: 'post', actorId: 'usr_1', postId: 'pst_1', createdAt }),
		).toEqual([])
	})
	it('notifies a post author of a top-level comment', () => {
		expect(notificationRecipients(comment)).toMatchObject([
			{
				recipientId: 'usr_2',
				type: 'comment',
				commentId: 'cmt_1',
				dedupeKey: 'comment:cmt_1:usr_2',
			},
		])
	})
	it('notifies only the exact reply target and the post author', () => {
		expect(notificationRecipients({ ...comment, replyAuthorId: 'usr_3' })).toMatchObject([
			{ recipientId: 'usr_2', type: 'comment' },
			{ recipientId: 'usr_3', type: 'reply' },
		])
	})
	it('prefers a single reply when its target is also the post author', () => {
		expect(notificationRecipients({ ...comment, replyAuthorId: 'usr_2' })).toMatchObject([
			{ recipientId: 'usr_2', type: 'reply' },
		])
	})
	it('excludes actors who are the post author or reply target', () => {
		expect(
			notificationRecipients({ ...comment, postAuthorId: 'usr_1', replyAuthorId: 'usr_3' }),
		).toMatchObject([{ recipientId: 'usr_3' }])
		expect(notificationRecipients({ ...comment, replyAuthorId: 'usr_1' })).toMatchObject([
			{ recipientId: 'usr_2' },
		])
		expect(
			notificationRecipients({ ...comment, postAuthorId: 'usr_1', replyAuthorId: 'usr_1' }),
		).toEqual([])
	})
	it('creates a stable lifetime like key', () => {
		expect(
			notificationRecipients({
				type: 'like',
				actorId: 'usr_1',
				recipientId: 'usr_2',
				postId: 'pst_1',
				createdAt,
			}),
		).toMatchObject([{ dedupeKey: 'like:usr_1:pst_1', type: 'like' }])
	})
	it('creates a stable follow key without a post target', () => {
		expect(
			notificationRecipients({ type: 'follow', actorId: 'usr_1', recipientId: 'usr_2', createdAt }),
		).toMatchObject([
			{ dedupeKey: 'follow:usr_1:usr_2', postId: null, commentId: null, type: 'follow' },
		])
	})
	it.each(['like', 'follow'] as const)('suppresses self %s notifications', (type) => {
		expect(
			notificationRecipients({
				type,
				actorId: 'usr_1',
				recipientId: 'usr_1',
				postId: 'pst_1',
				createdAt,
			}),
		).toEqual([])
	})
})

describe('validateNotificationId', () => {
	it.each(['ntf_1', `ntf_${'a'.repeat(128)}`, 'ntf_a-B_2'])('accepts %s', (id) => {
		expect(validateNotificationId(id)).toBe(id)
	})
	it.each([null, undefined, 1, [], {}, '', 'pst_1', 'ntf_', 'ntf_💙', `ntf_${'a'.repeat(129)}`])(
		'rejects invalid identifiers %j',
		(id) => {
			expect(() => validateNotificationId(id)).toThrow(
				expect.objectContaining({ code: 'VALIDATION_FAILED', fields: { id: 'INVALID_FORMAT' } }),
			)
		},
	)
})

import { describe, expect, it } from 'vitest'
import type { Comment } from '$lib/contract'
import { focusBranch } from './comment-thread'

const root: Comment = {
	id: 'cmt_root',
	postId: 'pst_1',
	parentId: null,
	replyToUser: null,
	replyToCommentId: null,
	author: { id: 'usr_1', username: 'one', displayName: 'One', avatarUrl: null },
	body: 'Root',
	replyCount: 3,
	viewer: { canDelete: true },
	createdAt: '2026-10-04T00:00:00Z',
}
const reply = (id: string): Comment => ({ ...root, id, parentId: root.id, replyCount: 0 })

describe('focusBranch', () => {
	it('keeps a flat parent and one level of replies', () => {
		const replies = [reply('cmt_a'), reply('cmt_b')]
		expect(focusBranch(root, replies, null)).toEqual({ ancestors: [], parent: root, replies })
	})
	it('promotes the selected reply and keeps the known ancestor as context', () => {
		const a = reply('cmt_a'),
			b = reply('cmt_b')
		expect(focusBranch(root, [a, b], b.id)).toEqual({ ancestors: [root], parent: b, replies: [] })
	})
	it('does not infer deeper ancestry from a repeated addressed user', () => {
		const a = reply('cmt_a'),
			b = { ...reply('cmt_b'), replyToUser: root.author }
		expect(focusBranch(root, [a, b], b.id).ancestors).toEqual([root])
	})
	it('falls back to the root when the selected reply was deleted', () => {
		expect(focusBranch(root, [], 'cmt_missing')).toEqual({
			ancestors: [],
			parent: root,
			replies: [],
		})
	})
	it('excludes replies from other roots', () => {
		expect(focusBranch(root, [{ ...reply('cmt_a'), parentId: 'other' }], 'cmt_a').replies).toEqual(
			[],
		)
	})
})

describe('comment branches', () => {
	it('hides deeper replies until their exact parent is expanded', () => {
		const a = reply('cmt_a')
		const b = { ...reply('cmt_b'), replyToCommentId: a.id }
		expect(focusBranch(root, [a, b], null).replies).toEqual([a])
		expect(focusBranch(root, [a, b], a.id)).toEqual({ ancestors: [root], parent: a, replies: [b] })
	})
	it('retains the exact ancestor chain for deeper branches', () => {
		const a = reply('cmt_a')
		const b = { ...reply('cmt_b'), replyToCommentId: a.id }
		const c = { ...reply('cmt_c'), replyToCommentId: b.id }
		expect(focusBranch(root, [a, b, c], b.id)).toEqual({
			ancestors: [root, a],
			parent: b,
			replies: [c],
		})
	})
	it('keeps legacy replies and replies with deleted parents accessible', () => {
		const a = { ...reply('cmt_a'), replyToCommentId: 'cmt_deleted' }
		expect(focusBranch(root, [a], null).replies).toEqual([a])
	})
	it('stops ancestor traversal at a cycle', () => {
		const a = { ...reply('cmt_a'), replyToCommentId: 'cmt_b' }
		const b = { ...reply('cmt_b'), replyToCommentId: a.id }
		expect(focusBranch(root, [a, b], a.id).ancestors).toEqual([root, b])
	})
})

import { describe, expect, it } from 'vitest'
import type { Comment } from '$lib/contract'
import {
	canSubmitComment,
	cancelReplyTarget,
	selectReplyTarget,
	submittedParentId,
	type ComposerTarget,
} from './composer-state'

const comment: Comment = {
	id: 'cmt_root',
	postId: 'pst_1',
	parentId: null,
	replyToUser: null,
	replyToCommentId: null,
	author: { id: 'usr_1', username: 'one', displayName: 'One', avatarUrl: null },
	body: 'Root',
	replyCount: 0,
	viewer: { canDelete: true },
	createdAt: '2026-10-04T00:00:00Z',
}
const idle: ComposerTarget = { target: null, fallbackParentId: 'cmt_old', pending: false }

describe('canSubmitComment', () => {
	it('rejects empty and whitespace-only input', () => {
		for (const body of ['', '  \n ']) expect(canSubmitComment(body, false)).toBe(false)
	})
	it('accepts a trimmed non-empty body up to the shared limit', () => {
		expect(canSubmitComment(' hi ', false)).toBe(true)
		expect(canSubmitComment('a'.repeat(500), false)).toBe(true)
		expect(canSubmitComment('a'.repeat(501), false)).toBe(false)
	})
	it('counts Unicode code points', () => {
		expect(canSubmitComment('😀'.repeat(500), false)).toBe(true)
		expect(canSubmitComment('😀'.repeat(501), false)).toBe(false)
	})
	it('blocks duplicate submissions', () => {
		expect(canSubmitComment('hello', true)).toBe(false)
	})
})

describe('reply target reducers', () => {
	it('clears a restored fallback id when selecting a target', () => {
		expect(selectReplyTarget(idle, comment)).toEqual({
			target: comment,
			fallbackParentId: '',
			pending: false,
		})
	})
	it('clears both target and fallback when cancelling', () => {
		expect(cancelReplyTarget({ ...idle, target: comment })).toEqual({
			target: null,
			fallbackParentId: '',
			pending: false,
		})
	})
	it('ignores selecting a target while pending', () => {
		const state = { ...idle, pending: true }
		expect(selectReplyTarget(state, comment)).toBe(state)
	})
	it('ignores cancelling while pending', () => {
		const state = { target: comment, fallbackParentId: '', pending: true }
		expect(cancelReplyTarget(state)).toBe(state)
	})
})

describe('submittedParentId', () => {
	it('prefers the target', () => {
		expect(submittedParentId({ target: comment, fallbackParentId: 'cmt_old' })).toBe('cmt_root')
	})
	it('uses the fallback when there is no target', () => {
		expect(submittedParentId({ target: null, fallbackParentId: 'cmt_old' })).toBe('cmt_old')
	})
	it('is empty without target or fallback', () => {
		expect(submittedParentId({ target: null, fallbackParentId: '' })).toBe('')
	})
})

import { describe, expect, it } from 'vitest'
import { aComment } from '../application/testing/a-comment'
import {
	canDeleteComment,
	resolveParent,
	validateCommentBody,
	validateParentId,
	withViewer,
} from './comment'

const fails = (run: () => unknown, fields: Record<string, string>) =>
	expect(run).toThrow(expect.objectContaining({ code: 'VALIDATION_FAILED', fields }))
const emoji = '\u{1F600}'

describe('validateCommentBody', () => {
	it('trims the body', () => {
		expect(validateCommentBody('  hi  ')).toBe('hi')
	})

	it('rejects a non-string body', () => {
		fails(() => validateCommentBody(5), { body: 'INVALID_FORMAT' })
		fails(() => validateCommentBody(undefined), { body: 'INVALID_FORMAT' })
	})

	it('rejects an empty or whitespace body', () => {
		fails(() => validateCommentBody(''), { body: 'REQUIRED' })
		fails(() => validateCommentBody('  \n '), { body: 'REQUIRED' })
	})

	it('accepts exactly 500 characters and rejects 501', () => {
		expect(validateCommentBody('a'.repeat(500))).toHaveLength(500)
		fails(() => validateCommentBody('a'.repeat(501)), { body: 'TOO_LONG' })
	})

	it('counts Unicode characters, not UTF-16 units', () => {
		expect([...validateCommentBody(emoji.repeat(500))]).toHaveLength(500)
		fails(() => validateCommentBody(emoji.repeat(501)), { body: 'TOO_LONG' })
	})
})

describe('validateParentId', () => {
	it('treats missing values as top-level', () => {
		for (const value of [undefined, null, '']) expect(validateParentId(value)).toBe(null)
	})

	it('accepts a comment id', () => {
		expect(validateParentId('cmt_1')).toBe('cmt_1')
	})

	it('rejects anything else', () => {
		fails(() => validateParentId('pst_1'), { parentId: 'INVALID_FORMAT' })
		fails(() => validateParentId(3), { parentId: 'INVALID_FORMAT' })
	})
})

describe('resolveParent', () => {
	it('uses a top-level parent as is with no replyTo user', () => {
		const parent = aComment({ id: 'cmt_1' })
		expect(resolveParent('pst_1', parent)).toEqual({
			parentId: 'cmt_1',
			replyToUserId: null,
			replyToCommentId: 'cmt_1',
		})
	})

	it('flattens a reply to its top-level comment and points at the reply author', () => {
		const reply = aComment({ id: 'cmt_2', parentId: 'cmt_1', authorId: 'usr_3' })
		expect(resolveParent('pst_1', reply)).toEqual({
			parentId: 'cmt_1',
			replyToUserId: 'usr_3',
			replyToCommentId: 'cmt_2',
		})
	})

	it('reports a missing parent', () => {
		expect(() => resolveParent('pst_1', null)).toThrow(
			expect.objectContaining({ code: 'NOT_FOUND' }),
		)
	})

	it('reports a parent on another post', () => {
		const parent = aComment({ postId: 'pst_2' })
		expect(() => resolveParent('pst_1', parent)).toThrow(
			expect.objectContaining({ code: 'NOT_FOUND' }),
		)
	})
})

describe('canDeleteComment', () => {
	it('allows the comment author and the post author only', () => {
		expect(canDeleteComment('usr_2', 'usr_2', 'usr_1')).toBe(true)
		expect(canDeleteComment('usr_1', 'usr_2', 'usr_1')).toBe(true)
		expect(canDeleteComment('usr_3', 'usr_2', 'usr_1')).toBe(false)
	})
})

describe('withViewer', () => {
	it('protects the post author comment from other viewers', () => {
		const comment = aComment({ authorId: 'usr_1' })
		expect(withViewer(comment, 'usr_2', 'usr_1').viewer.canDelete).toBe(false)
		expect(withViewer(comment, 'usr_1', 'usr_1').viewer.canDelete).toBe(true)
	})

	it('marks canDelete for the viewer and never for guests', () => {
		const comment = aComment({ authorId: 'usr_2' })
		expect(withViewer(comment, 'usr_2', 'usr_1').viewer.canDelete).toBe(true)
		expect(withViewer(comment, 'usr_3', 'usr_1').viewer.canDelete).toBe(false)
		expect(withViewer(comment, null, 'usr_1').viewer.canDelete).toBe(false)
	})
})

import { describe, expect, it } from 'vitest'
import { focusCommentInput } from './focus-comment-input'

describe('focusCommentInput', () => {
	it('focuses the comment field without scrolling or moving its caret', () => {
		let requestedId = ''
		let options: FocusOptions | undefined
		focusCommentInput({
			getElementById: (id) => {
				requestedId = id
				return { focus: (value) => (options = value) }
			},
		})
		expect(requestedId).toBe('comment-body')
		expect(options).toEqual({ preventScroll: true })
	})

	it('does nothing when no comment field is available', () => {
		expect(() => focusCommentInput({ getElementById: () => null })).not.toThrow()
	})
})

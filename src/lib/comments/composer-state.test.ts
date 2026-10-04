import { describe, expect, it } from 'vitest'
import { canSubmitComment } from './composer-state'

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

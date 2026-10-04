// cspell:ignore replacestate
import { describe, expect, it } from 'vitest'
import { readReplaceStateOption } from './replace-state-option'

describe('readReplaceStateOption', () => {
	it('defaults to router behavior when no link source is available', () => {
		expect(readReplaceStateOption(null)).toBeUndefined()
	})

	it('defaults to router behavior when no option is declared', () => {
		expect(readReplaceStateOption({ closest: () => null })).toBeUndefined()
	})

	it('reads the nearest declared option, including an inherited option', () => {
		let selector = ''
		let attribute = ''
		const result = readReplaceStateOption({
			closest: (value) => {
				selector = value
				return {
					getAttribute: (name) => {
						attribute = name
						return 'true'
					},
				}
			},
		})
		expect(result).toBe(true)
		expect(selector).toBe('[data-sveltekit-replacestate]')
		expect(attribute).toBe('data-sveltekit-replacestate')
	})

	it('supports the router boolean option values', () => {
		for (const [value, expected] of [
			['', true],
			['true', true],
			['false', false],
			['off', false],
		] as const) {
			expect(readReplaceStateOption({ closest: () => ({ getAttribute: () => value }) })).toBe(
				expected,
			)
		}
	})

	it('ignores unsupported option values', () => {
		for (const value of [null, 'invalid']) {
			expect(
				readReplaceStateOption({ closest: () => ({ getAttribute: () => value }) }),
			).toBeUndefined()
		}
	})
})

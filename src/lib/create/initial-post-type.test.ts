import { describe, expect, it } from 'vitest'
import { initialPostType } from './initial-post-type'

describe('initialPostType', () => {
	it.each(['post', 'reel', 'story'] as const)('accepts %s', (type) => {
		expect(initialPostType(type)).toBe(type)
	})
	it.each([null, undefined, '', 'video', 'STORY'])('falls back to post for %s', (value) => {
		expect(initialPostType(value)).toBe('post')
	})
})

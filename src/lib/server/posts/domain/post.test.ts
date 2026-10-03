import { describe, expect, it } from 'vitest'
import { validateCaption, validatePost } from './post'

describe('post validation', () => {
	it('trims captions and measures Unicode characters', () => {
		expect(validateCaption(` ${'😀'.repeat(2200)} `)).toBe('😀'.repeat(2200))
		expect(() => validateCaption('😀'.repeat(2201))).toThrow('VALIDATION_FAILED')
	})
	it('accepts a text post and a video reel reference', () => {
		expect(validatePost({ type: 'post', caption: ' Hello ' })).toEqual({
			type: 'post',
			caption: 'Hello',
			mediaIds: [],
		})
		expect(validatePost({ type: 'reel', mediaIds: ['med_1'] }).type).toBe('reel')
	})
	it.each([
		null,
		'hello',
		{},
		{ type: 'invalid' },
		{ type: 'post', caption: 12 },
		{ type: 'post', caption: ' ' },
		{ type: 'post', mediaIds: 'med_1' },
		{ type: 'post', mediaIds: [1] },
		{ type: 'post', mediaIds: ['bad'] },
		{ type: 'post', mediaIds: ['med_1', 'med_1'] },
		{ type: 'post', mediaIds: Array.from({ length: 11 }, (_, index) => `med_${index}`) },
		{ type: 'reel', caption: 'hi' },
	])('rejects malformed input %j', (input) => {
		expect(() => validatePost(input)).toThrow('VALIDATION_FAILED')
	})
})

import { describe, expect, it } from 'vitest'
import { isStoryActive, storyExpiresAt, validateStory } from './story'

describe('validateStory', () => {
	it('returns the media id of a valid input', () => {
		expect(validateStory({ mediaId: 'med_1' })).toBe('med_1')
	})

	it.each([null, undefined, 'med_1', 5])('rejects a non-object input (%s)', (input) => {
		expect(() => validateStory(input)).toThrowError(
			expect.objectContaining({ code: 'VALIDATION_FAILED' }),
		)
	})

	it.each([{}, { mediaId: 5 }, { mediaId: 'pst_1' }, { mediaId: 'med_' }, { mediaId: 'med_a b' }])(
		'rejects a missing or malformed media id (%j)',
		(input) => {
			expect(() => validateStory(input)).toThrowError(
				expect.objectContaining({
					code: 'VALIDATION_FAILED',
					fields: { mediaId: 'INVALID_FORMAT' },
				}),
			)
		},
	)

	it('rejects a caption because stories have none', () => {
		expect(() => validateStory({ mediaId: 'med_1', caption: 'hi' })).toThrowError(
			expect.objectContaining({ fields: { caption: 'NOT_ALLOWED' } }),
		)
	})
})

describe('storyExpiresAt', () => {
	it('is 24 hours after the given time', () => {
		const now = new Date('2026-10-03T00:00:00Z')

		expect(storyExpiresAt(now).toISOString()).toBe('2026-10-04T00:00:00.000Z')
	})
})

describe('isStoryActive', () => {
	const story = { expiresAt: '2026-10-04T00:00:00.000Z' }

	it('is active just before the expiry', () => {
		expect(isStoryActive(story, new Date('2026-10-03T23:59:59.999Z'))).toBe(true)
	})

	it('is expired exactly at the expiry', () => {
		expect(isStoryActive(story, new Date('2026-10-04T00:00:00.000Z'))).toBe(false)
	})

	it('is expired after the expiry', () => {
		expect(isStoryActive(story, new Date('2026-10-04T00:00:00.001Z'))).toBe(false)
	})
})

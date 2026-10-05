import { describe, expect, it } from 'vitest'
import { IMAGE_STORY_MS, storyProgress } from './progress'

describe('story progress', () => {
	it('tracks image story time and clamps the ends', () => {
		expect(storyProgress(IMAGE_STORY_MS / 2, IMAGE_STORY_MS)).toBe(0.5)
		expect(storyProgress(-10, IMAGE_STORY_MS)).toBe(0)
		expect(storyProgress(IMAGE_STORY_MS * 2, IMAGE_STORY_MS)).toBe(1)
	})
	it('does not advance on an unknown video duration', () => {
		expect(storyProgress(2, 0)).toBe(0)
		expect(storyProgress(Number.NaN, 3)).toBe(0)
	})
})

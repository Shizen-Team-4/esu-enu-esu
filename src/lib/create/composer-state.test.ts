import { describe, expect, it } from 'vitest'
import { CAPTION_MAX } from '$lib/contract'
import { acceptFor, canPublish, maxFiles, type PublishState } from './composer-state'

const base: PublishState = {
	type: 'post',
	caption: 'hello',
	mediaCount: 0,
	uploading: false,
	failed: false,
}
const make = (patch: Partial<PublishState>): PublishState => ({ ...base, ...patch })

describe('maxFiles', () => {
	it('allows ten files for a post', () => expect(maxFiles('post')).toBe(10))
	it.each(['reel', 'story'] as const)('allows one file for a %s', (type) => {
		expect(maxFiles(type)).toBe(1)
	})
})

describe('acceptFor', () => {
	it('accepts images for the photo picker of a post and a story', () => {
		expect(acceptFor('post', 'image')).toBe('image/jpeg,image/png,image/webp')
		expect(acceptFor('story', 'image')).toBe('image/jpeg,image/png,image/webp')
	})
	it('accepts no images for a reel', () => expect(acceptFor('reel', 'image')).toBe(''))
	it.each(['post', 'reel', 'story'] as const)('accepts mp4 and webm video for a %s', (type) => {
		expect(acceptFor(type, 'video')).toBe('video/mp4,video/webm')
	})
})

describe('canPublish', () => {
	it('allows a post with only a caption', () => expect(canPublish(make({}))).toBe(true))
	it('allows a post with only media', () => {
		expect(canPublish(make({ caption: '  ', mediaCount: 1 }))).toBe(true)
	})
	it('rejects an empty post', () => expect(canPublish(make({ caption: '   ' }))).toBe(false))
	it('rejects a post with more than ten media', () => {
		expect(canPublish(make({ mediaCount: 11 }))).toBe(false)
	})
	it('allows a post with ten media', () => expect(canPublish(make({ mediaCount: 10 }))).toBe(true))
	it('rejects a caption over the limit', () => {
		expect(canPublish(make({ caption: 'a'.repeat(CAPTION_MAX + 1) }))).toBe(false)
	})
	it('allows a caption at the limit', () => {
		expect(canPublish(make({ caption: 'a'.repeat(CAPTION_MAX) }))).toBe(true)
	})
	it.each(['reel', 'story'] as const)('requires exactly one media for a %s', (type) => {
		expect(canPublish(make({ type, mediaCount: 0 }))).toBe(false)
		expect(canPublish(make({ type, mediaCount: 1 }))).toBe(true)
		expect(canPublish(make({ type, mediaCount: 2 }))).toBe(false)
	})
	it('rejects an over-long caption on a reel', () => {
		const caption = 'a'.repeat(CAPTION_MAX + 1)
		expect(canPublish(make({ type: 'reel', caption, mediaCount: 1 }))).toBe(false)
	})
	it('ignores the caption for a story', () => {
		const caption = 'a'.repeat(CAPTION_MAX + 1)
		expect(canPublish(make({ type: 'story', caption, mediaCount: 1 }))).toBe(true)
	})
	it('rejects while uploading', () => {
		expect(canPublish(make({ mediaCount: 1, uploading: true }))).toBe(false)
	})
	it('rejects while an upload has failed', () => {
		expect(canPublish(make({ mediaCount: 1, failed: true }))).toBe(false)
	})
})

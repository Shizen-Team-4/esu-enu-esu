import { describe, expect, it } from 'vitest'
import type { Media } from '$lib/contract'
import { tileKind } from './tile-kind'

const media = (over: Partial<Media>): Media => ({
	id: 'm',
	type: 'image',
	url: 'u',
	thumbnailUrl: null,
	width: 1,
	height: 1,
	durationSec: null,
	...over,
})

describe('tileKind', () => {
	it('uses the image url for images', () => {
		expect(tileKind(media({ url: 'a.jpg' }))).toEqual({ kind: 'image', url: 'a.jpg' })
	})
	it('uses the thumbnail for videos', () => {
		expect(tileKind(media({ type: 'video', thumbnailUrl: 't.jpg' }))).toEqual({
			kind: 'video-thumb',
			url: 't.jpg',
		})
	})
	it('keeps a video without a thumbnail distinct from a text status', () => {
		expect(tileKind(media({ type: 'video' }))).toEqual({ kind: 'video' })
	})
	it('falls back to text when there is no media', () => {
		expect(tileKind(undefined)).toEqual({ kind: 'text' })
	})
})

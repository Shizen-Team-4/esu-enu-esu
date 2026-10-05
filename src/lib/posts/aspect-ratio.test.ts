import { describe, expect, it } from 'vitest'
import { frameRatio, mediaOrientation } from './aspect-ratio'

describe('mediaOrientation', () => {
	it('detects portrait', () => expect(mediaOrientation(1080, 1920)).toBe('portrait'))
	it('detects square', () => expect(mediaOrientation(1080, 1080)).toBe('square'))
	it('detects landscape', () => expect(mediaOrientation(1920, 1080)).toBe('landscape'))
})

describe('frameRatio', () => {
	it('keeps the ratio of a square item', () => {
		expect(frameRatio({ width: 1080, height: 1080 })).toBe(1)
	})

	it('keeps a 4:5 item as it is', () => {
		expect(frameRatio({ width: 1080, height: 1350 })).toBeCloseTo(0.8)
	})

	it('limits a tall item to 4:5', () => {
		expect(frameRatio({ width: 1080, height: 1920 })).toBeCloseTo(0.8)
	})

	it('keeps a 16:9 item as it is', () => {
		expect(frameRatio({ width: 1920, height: 1080 })).toBeCloseTo(16 / 9)
	})

	it('limits a very wide item to 16:9', () => {
		expect(frameRatio({ width: 3000, height: 1000 })).toBeCloseTo(16 / 9)
	})
})

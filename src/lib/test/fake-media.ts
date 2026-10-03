import { vi } from 'vitest'

/**
 * jsdom cannot play media. Replaces play/pause on HTMLMediaElement with spies that emit the
 * events a browser would. Call `vi.restoreAllMocks()` afterwards.
 */
export function installFakeMedia() {
	const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
		this: HTMLMediaElement,
	) {
		this.dispatchEvent(new Event('play'))
		return Promise.resolve()
	})
	const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
		this: HTMLMediaElement,
	) {
		this.dispatchEvent(new Event('pause'))
	})
	return { play, pause }
}

/** Reads `aspect-ratio` from an inline style; jsdom may serialize 1 as "1 / 1". */
export function aspectRatioOf(element: HTMLElement): number {
	const [width, height = '1'] = element.style.aspectRatio.split('/')
	return Number(width) / Number(height)
}

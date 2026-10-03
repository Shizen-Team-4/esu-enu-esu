import type { Media } from '$lib/types/media'

export type Orientation = 'portrait' | 'square' | 'landscape'

/** Narrowest and widest gallery frame (width / height): 4:5 and 16:9. */
export const MIN_FRAME_RATIO = 4 / 5
export const MAX_FRAME_RATIO = 16 / 9
export const REEL_RATIO = 9 / 16

export function mediaOrientation(width: number, height: number): Orientation {
	if (width === height) return 'square'
	return width > height ? 'landscape' : 'portrait'
}

/** Width / height of the frame for an item: its own ratio, limited to 4:5 .. 16:9. */
export function frameRatio(media: Pick<Media, 'width' | 'height'>): number {
	const ratio = media.width / media.height
	return Math.min(MAX_FRAME_RATIO, Math.max(MIN_FRAME_RATIO, ratio))
}

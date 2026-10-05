export interface Media {
	id: string
	type: 'image' | 'video'
	url: string
	/** video poster image; null for images */
	thumbnailUrl: string | null
	/** pixels; the UI keeps this aspect ratio */
	width: number
	height: number
	/** videos only */
	durationSec: number | null
}

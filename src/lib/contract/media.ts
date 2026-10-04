export interface Media {
	id: string
	type: 'image' | 'video'
	url: string
	thumbnailUrl: string | null
	width: number
	height: number
	durationSec: number | null
}

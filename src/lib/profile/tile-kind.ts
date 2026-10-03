import type { Media } from '$lib/contract'

export type TileKind = { kind: 'image' | 'video-thumb'; url: string } | { kind: 'text' }

export function tileKind(media: Media | undefined): TileKind {
	if (media?.type === 'image') return { kind: 'image', url: media.url }
	if (media?.thumbnailUrl) return { kind: 'video-thumb', url: media.thumbnailUrl }
	return { kind: 'text' }
}

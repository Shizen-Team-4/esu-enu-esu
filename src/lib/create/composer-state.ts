import { CAPTION_MAX } from '$lib/contract'
import { isOver } from '$lib/format/char-count'
import type { ComposerType } from './initial-post-type'

export type PickerKind = 'image' | 'video'

export interface PublishState {
	type: ComposerType
	caption: string
	mediaCount: number
	uploading: boolean
	failed: boolean
}

const POST_MAX_FILES = 10

export const maxFiles = (type: ComposerType): number => (type === 'post' ? POST_MAX_FILES : 1)

export function acceptFor(type: ComposerType, kind: PickerKind): string {
	if (kind === 'image') return type === 'reel' ? '' : 'image/jpeg,image/png,image/webp'
	return 'video/mp4,video/webm'
}

function hasValidContent({ type, caption, mediaCount }: PublishState): boolean {
	if (type !== 'post') return mediaCount === 1
	const hasText = caption.trim().length > 0
	return (hasText || mediaCount > 0) && mediaCount <= POST_MAX_FILES
}

export function canPublish(state: PublishState): boolean {
	if (state.uploading || state.failed) return false
	if (state.type !== 'story' && isOver(state.caption, CAPTION_MAX)) return false
	return hasValidContent(state)
}

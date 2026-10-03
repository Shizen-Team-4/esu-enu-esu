import { AppError } from '../../shared/domain/app-error'
import type { UserSummary, Media, Post } from '$lib/contract'

export type { UserSummary, Media, Post }
export interface CreatePostInput {
	type: 'post' | 'reel'
	caption: string
	mediaIds: string[]
}

export function validateCaption(value: unknown): string {
	if (typeof value !== 'string')
		throw new AppError('VALIDATION_FAILED', { caption: 'INVALID_FORMAT' })
	const caption = value.trim()
	if ([...caption].length > 2200) throw new AppError('VALIDATION_FAILED', { caption: 'TOO_LONG' })
	return caption
}

export function validatePost(input: unknown): CreatePostInput {
	if (!input || typeof input !== 'object') throw new AppError('VALIDATION_FAILED')
	const value = input as Record<string, unknown>
	if (value.type !== 'post' && value.type !== 'reel')
		throw new AppError('VALIDATION_FAILED', { type: 'INVALID_FORMAT' })
	const caption = validateCaption(value.caption ?? '')
	const mediaIds = value.mediaIds ?? []
	if (
		!Array.isArray(mediaIds) ||
		mediaIds.some((id) => typeof id !== 'string' || !id.startsWith('med_'))
	)
		throw new AppError('VALIDATION_FAILED', { mediaIds: 'INVALID_FORMAT' })
	if (new Set(mediaIds).size !== mediaIds.length)
		throw new AppError('VALIDATION_FAILED', { mediaIds: 'INVALID_FORMAT' })
	if (mediaIds.length > 10) throw new AppError('VALIDATION_FAILED', { mediaIds: 'TOO_MANY' })
	if (value.type === 'reel' && mediaIds.length !== 1)
		throw new AppError('VALIDATION_FAILED', { mediaIds: 'REQUIRED' })
	if (!caption && !mediaIds.length) throw new AppError('VALIDATION_FAILED', { caption: 'REQUIRED' })
	return { type: value.type, caption, mediaIds }
}

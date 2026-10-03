import { AppError } from '../../shared/domain/app-error'
import type { Story, StoryTrayItem } from '$lib/contract'

export type { Story, StoryTrayItem }

export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000
export function validateStory(input: unknown): string {
	if (!input || typeof input !== 'object') throw new AppError('VALIDATION_FAILED')
	const value = input as Record<string, unknown>
	if ('caption' in value) throw new AppError('VALIDATION_FAILED', { caption: 'NOT_ALLOWED' })
	if (typeof value.mediaId !== 'string' || !/^med_[A-Za-z0-9_-]+$/.test(value.mediaId))
		throw new AppError('VALIDATION_FAILED', { mediaId: 'INVALID_FORMAT' })
	return value.mediaId
}

import { DEFAULT_LANG, isSupported, type Lang } from '$lib/i18n/config'
import { AppError } from '../../shared/domain/app-error'

export const themes = ['system', 'light', 'dark'] as const
export type Theme = (typeof themes)[number]
export interface Preferences {
	theme: Theme
	language: Lang
	updatedAt: string
}
export type PreferencesInput = Partial<Pick<Preferences, 'theme' | 'language'>>

export function validatePreferences(input: unknown): PreferencesInput {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		throw new AppError('VALIDATION_FAILED')
	}
	const value = input as Record<string, unknown>
	const fields: Record<string, string> = {}
	for (const key of Object.keys(value)) {
		if (key !== 'theme' && key !== 'language') fields[key] = 'NOT_ALLOWED'
	}
	if ('theme' in value && !themes.includes(value.theme as Theme)) fields.theme = 'INVALID_FORMAT'
	if ('language' in value && !isSupported(value.language)) fields.language = 'INVALID_FORMAT'
	if (Object.keys(fields).length) throw new AppError('VALIDATION_FAILED', fields)
	return value as PreferencesInput
}

export function defaultPreferences(now: Date, language: Lang = DEFAULT_LANG): Preferences {
	return { theme: 'system', language, updatedAt: now.toISOString() }
}

import { AppError } from '../../shared/domain/app-error'

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/
export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
export const DISPLAY_NAME_MAX = 50
export const BIO_MAX = 160

export interface ProfilePatch {
	username?: string
	displayName?: string
	bio?: string
	/** `null` removes the avatar. */
	avatarMediaId?: string | null
}

const fail = (field: string, code: string): never => {
	throw new AppError('VALIDATION_FAILED', { [field]: code })
}
const length = (value: string) => [...value].length

export function validateUsername(value: unknown): string {
	if (typeof value !== 'string') return fail('username', 'INVALID_FORMAT')
	const username = value.trim()
	if (!username) return fail('username', 'REQUIRED')
	if (length(username) < USERNAME_MIN) return fail('username', 'TOO_SHORT')
	if (length(username) > USERNAME_MAX) return fail('username', 'TOO_LONG')
	if (!USERNAME_PATTERN.test(username)) return fail('username', 'INVALID_FORMAT')
	return username
}

export function validateDisplayName(value: unknown): string {
	if (typeof value !== 'string') return fail('displayName', 'INVALID_FORMAT')
	const name = value.trim()
	if (!name) return fail('displayName', 'REQUIRED')
	if (length(name) > DISPLAY_NAME_MAX) return fail('displayName', 'TOO_LONG')
	return name
}

export function validateBio(value: unknown): string {
	if (typeof value !== 'string') return fail('bio', 'INVALID_FORMAT')
	const bio = value.trim()
	if (length(bio) > BIO_MAX) return fail('bio', 'TOO_LONG')
	return bio
}

export function validateAvatarMediaId(value: unknown): string | null {
	if (value === null) return null
	if (typeof value !== 'string' || !value.startsWith('med_'))
		return fail('avatarMediaId', 'INVALID_FORMAT')
	return value
}

const validators = {
	username: validateUsername,
	displayName: validateDisplayName,
	bio: validateBio,
	avatarMediaId: validateAvatarMediaId,
} as const

/**
 * Validates a partial update. Only keys that are present (not undefined) are checked and returned;
 * unknown keys are ignored. Every invalid field is reported together. An empty patch is valid.
 */
export function validateProfileUpdate(input: unknown): ProfilePatch {
	if (!input || typeof input !== 'object' || Array.isArray(input))
		throw new AppError('VALIDATION_FAILED')
	const source = input as Record<string, unknown>
	const patch: Record<string, unknown> = {}
	const fields: Record<string, string> = {}
	for (const [key, validate] of Object.entries(validators)) {
		if (source[key] === undefined) continue
		try {
			patch[key] = validate(source[key])
		} catch (cause) {
			Object.assign(fields, (cause as AppError).fields)
		}
	}
	if (Object.keys(fields).length) throw new AppError('VALIDATION_FAILED', fields)
	return patch as ProfilePatch
}

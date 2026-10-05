export interface ProfileFormValues {
	username: string
	displayName: string
	bio: string
	avatarMediaId: string
	removeAvatar: boolean
}

/** A comparable string for the editable profile fields; leading/trailing username space is ignored. */
export function snapshot(values: ProfileFormValues): string {
	return JSON.stringify([
		values.username.trim(),
		values.displayName,
		values.bio,
		values.avatarMediaId,
		values.removeAvatar,
	])
}

export const isDirty = (base: string, current: string): boolean => base !== current

export type FormStatus = 'dirty' | 'error' | 'saved' | 'idle'

/** Unsaved edits win over the result of the last submit. */
export function formStatus(state: { dirty: boolean; failed: boolean; saved: boolean }): FormStatus {
	if (state.dirty) return 'dirty'
	if (state.failed) return 'error'
	if (state.saved) return 'saved'
	return 'idle'
}

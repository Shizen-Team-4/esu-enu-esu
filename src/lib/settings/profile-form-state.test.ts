import { describe, expect, it } from 'vitest'
import { formStatus, isDirty, snapshot, type ProfileFormValues } from './profile-form-state'

const base: ProfileFormValues = {
	username: 'alice',
	displayName: 'Alice',
	bio: 'Hi',
	avatarMediaId: '',
	removeAvatar: false,
}

describe('profile form state', () => {
	it('is clean when nothing changed', () => {
		expect(isDirty(snapshot(base), snapshot({ ...base }))).toBe(false)
	})

	it.each([
		['username', { username: 'bob' }],
		['display name', { displayName: 'Alicia' }],
		['bio', { bio: 'Hello' }],
		['picked avatar', { avatarMediaId: 'med_1' }],
		['remove avatar', { removeAvatar: true }],
	])('is dirty when the %s changes', (_name, change) => {
		expect(isDirty(snapshot(base), snapshot({ ...base, ...change }))).toBe(true)
	})

	it('ignores surrounding whitespace in the username', () => {
		expect(isDirty(snapshot(base), snapshot({ ...base, username: ' alice ' }))).toBe(false)
	})

	it('keeps whitespace changes in the bio', () => {
		expect(isDirty(snapshot(base), snapshot({ ...base, bio: 'Hi ' }))).toBe(true)
	})
})

describe('formStatus', () => {
	it('reports unsaved edits even after a failed or saved submit', () => {
		expect(formStatus({ dirty: true, failed: true, saved: true })).toBe('dirty')
	})

	it('reports an error when the clean form failed to save', () => {
		expect(formStatus({ dirty: false, failed: true, saved: false })).toBe('error')
	})

	it('reports saved after a successful submit', () => {
		expect(formStatus({ dirty: false, failed: false, saved: true })).toBe('saved')
	})

	it('is idle with no edits and no submit result', () => {
		expect(formStatus({ dirty: false, failed: false, saved: false })).toBe('idle')
	})
})

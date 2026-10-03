import { describe, expect, it } from 'vitest'
import { profileFormInput } from './profile-form'

const formOf = (entries: Record<string, string>) => {
	const form = new FormData()
	for (const [key, value] of Object.entries(entries)) form.set(key, value)
	return form
}

describe('profileFormInput', () => {
	it('passes through the provided text fields', () => {
		expect(
			profileFormInput(
				formOf({ displayName: 'Mia', bio: '', username: ' mia ', avatarMediaId: 'med_1' }),
			),
		).toEqual({ displayName: 'Mia', bio: '', username: 'mia', avatarMediaId: 'med_1' })
	})

	it('omits fields that are not in the form', () => {
		expect(profileFormInput(formOf({}))).toEqual({})
	})

	it('treats an empty username and avatar id as unchanged', () => {
		expect(profileFormInput(formOf({ username: ' ', avatarMediaId: '' }))).toEqual({})
	})

	it('clears the avatar when the remove checkbox is on', () => {
		expect(profileFormInput(formOf({ avatarMediaId: 'med_1', removeAvatar: 'on' }))).toEqual({
			avatarMediaId: null,
		})
	})

	it('ignores file inputs in text fields', () => {
		const form = new FormData()
		form.set('bio', new File(['x'], 'x.txt'))

		expect(profileFormInput(form)).toEqual({})
	})
})

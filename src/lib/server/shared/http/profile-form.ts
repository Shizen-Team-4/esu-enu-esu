const text = (form: FormData, key: string) => {
	const value = form.get(key)
	return typeof value === 'string' ? value : undefined
}

/**
 * Maps the settings profile form to an updateMe input. Fields missing from the form are left out;
 * an empty username or avatar id means "unchanged", and the remove-avatar checkbox clears the avatar.
 */
export function profileFormInput(form: FormData): Record<string, unknown> {
	const input: Record<string, unknown> = {}
	const displayName = text(form, 'displayName')
	const bio = text(form, 'bio')
	const username = text(form, 'username')?.trim()
	const avatarMediaId = text(form, 'avatarMediaId')?.trim()
	if (displayName !== undefined) input.displayName = displayName
	if (bio !== undefined) input.bio = bio
	if (username) input.username = username
	if (form.get('removeAvatar') === 'on') input.avatarMediaId = null
	else if (avatarMediaId) input.avatarMediaId = avatarMediaId
	return input
}

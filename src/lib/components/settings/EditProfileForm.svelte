<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import TextField from '$lib/components/ui/TextField.svelte'
	import AvatarPicker from './AvatarPicker.svelte'
	import EditProfileFooter from './EditProfileFooter.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { charCount } from '$lib/format/char-count'
	import { BIO_MAX } from '$lib/contract'
	import { formStatus, isDirty, snapshot } from '$lib/settings/profile-form-state'

	type Profile = { username: string; displayName: string; bio: string; avatarUrl: string | null }
	type Form = { saved?: boolean; error?: { code?: string; fields?: Record<string, string> } } | null
	let { profile, form }: { profile: Profile; form: Form } = $props()

	// Initial values only: the form owns its edits and is re-created on navigation.
	// svelte-ignore state_referenced_locally
	let username = $state(profile.username)
	// svelte-ignore state_referenced_locally
	let displayName = $state(profile.displayName)
	// svelte-ignore state_referenced_locally
	let bio = $state(profile.bio)
	let mediaId = $state('')
	let removed = $state(false)
	let uploading = $state(false)
	let pending = $state(false)
	let justSaved = $state(false)

	const current = $derived(
		snapshot({ username, displayName, bio, avatarMediaId: mediaId, removeAvatar: removed }),
	)
	// svelte-ignore state_referenced_locally
	let base = $state(snapshot({ ...profile, avatarMediaId: '', removeAvatar: false }))
	const dirty = $derived(isDirty(base, current))
	const fields = $derived(form?.error?.fields)
	const failure = $derived(form?.error?.code && !fields ? $_(errorMessageKey(form.error.code)) : '')
	const status = $derived(formStatus({ dirty, failed: Boolean(failure), saved: justSaved }))
</script>

<form
	method="POST"
	use:enhance={() => {
		pending = true
		justSaved = false
		return async ({ result, update }) => {
			await update({ reset: false })
			pending = false
			if (result.type === 'success') {
				base = current
				justSaved = true
			}
		}
	}}
	class="grid gap-5"
>
	<AvatarPicker
		avatarUrl={profile.avatarUrl}
		name={displayName || username}
		bind:mediaId
		bind:removed
		bind:uploading
		error={fields?.avatarMediaId}
	/>
	<TextField
		id="edit-profile-username"
		name="username"
		label={$_('auth.username')}
		prefix="@"
		autocapitalize="none"
		bind:value={username}
		error={fields?.username}
	/>
	<TextField
		id="edit-profile-display-name"
		name="displayName"
		label={$_('auth.name')}
		bind:value={displayName}
		error={fields?.displayName}
	/>
	<TextField
		id="edit-profile-bio"
		name="bio"
		label={$_('account.bio')}
		multiline
		maxlength={BIO_MAX}
		hint={$_('editProfile.bioHint')}
		counter={`${charCount(bio)} / ${BIO_MAX}`}
		bind:value={bio}
		error={fields?.bio}
	/>
	<EditProfileFooter
		{status}
		message={failure}
		cancelHref={`/u/${profile.username}`}
		canSave={dirty && !pending && !uploading}
	/>
</form>

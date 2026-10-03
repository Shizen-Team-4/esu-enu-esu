<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import type { FormStatus } from '$lib/settings/profile-form-state'

	type Props = {
		status: FormStatus
		message?: string
		cancelHref: string
		canSave: boolean
	}
	let { status, message = '', cancelHref, canSave }: Props = $props()
	const keys: Record<FormStatus, string | null> = {
		dirty: 'editProfile.unsaved',
		saved: 'editProfile.saved',
		error: null,
		idle: null,
	}
	const tones: Record<FormStatus, string> = {
		dirty: 'text-fg-muted',
		saved: 'text-success',
		error: 'text-danger',
		idle: 'text-fg-muted',
	}
	const key = $derived(keys[status])
	const fallback = $derived(status === 'error' ? message : '')
	const text = $derived(key ? $_(key) : fallback)
</script>

<div
	class="-mx-[18px] -mb-[18px] mt-6 flex flex-wrap items-center gap-3 border-t border-line px-[18px] py-3 md:-mx-[22px] md:-mb-[22px] md:px-[22px]"
>
	<p aria-live="polite" class="m-0 min-w-0 flex-1 text-meta {tones[status]}">{text}</p>
	<Button href={cancelHref} variant="ghost">{$_('editProfile.cancel')}</Button>
	<Button type="submit" variant="primary" disabled={!canSave}>{$_('editProfile.save')}</Button>
</div>

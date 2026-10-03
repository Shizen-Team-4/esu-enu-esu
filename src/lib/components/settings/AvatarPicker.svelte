<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import FieldError from '$lib/components/FieldError.svelte'
	import { ApiError } from '$lib/api/api-error'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { uploadFile } from '$lib/media/upload-file'

	type Props = {
		avatarUrl: string | null
		name: string
		mediaId?: string
		removed?: boolean
		error?: string | null
		uploading?: boolean
	}
	let {
		avatarUrl,
		name,
		mediaId = $bindable(''),
		removed = $bindable(false),
		error,
		uploading = $bindable(false),
	}: Props = $props()

	let input: HTMLInputElement
	let previewUrl = $state<string | null>(null)
	let uploadError = $state<string | null>(null)
	const shown = $derived(removed ? null : (previewUrl ?? avatarUrl))

	async function pick(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0]
		if (!file) return
		uploading = true
		uploadError = null
		try {
			const result = await uploadFile(file, 'avatar')
			if (previewUrl) URL.revokeObjectURL(previewUrl)
			previewUrl = URL.createObjectURL(file)
			mediaId = result.id
			removed = false
		} catch (cause) {
			uploadError = errorMessageKey(cause instanceof ApiError ? cause.code : 'INTERNAL')
		} finally {
			uploading = false
		}
	}
</script>

<div class="flex items-center gap-4">
	<div
		class="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-title font-bold text-primary"
	>
		{#if shown}<img src={shown} alt="" class="size-full object-cover" />{:else}<span
				aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span
			>{/if}
	</div>
	<div class="grid min-w-0 gap-2">
		<input type="hidden" name="avatarMediaId" value={mediaId} />
		<input
			bind:this={input}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			class="hidden"
			tabindex="-1"
			onchange={pick}
		/>
		<div>
			<Button type="button" variant="secondary" disabled={uploading} onclick={() => input.click()}
				>{$_(uploading ? 'editProfile.uploading' : 'editProfile.changePhoto')}</Button
			>
		</div>
		<label class="flex items-center gap-2 text-meta text-fg-muted"
			><input
				type="checkbox"
				name="removeAvatar"
				bind:checked={removed}
				class="min-h-0 accent-primary"
			/><span>{$_('account.removeAvatar')}</span></label
		>
	</div>
</div>
{#if uploadError}<p role="alert" class="mt-1 text-sm text-danger">{$_(uploadError)}</p>{/if}
<FieldError code={error} id="edit-profile-avatar-error" />

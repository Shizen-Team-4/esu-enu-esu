<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import { ApiError } from '$lib/api/api-error'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { uploadFile } from '$lib/media/upload-file'
	import FieldError from './FieldError.svelte'
	import type { ErrorEnvelope } from '$lib/contract'
	let { error: serverError }: { error?: ErrorEnvelope['error'] } = $props()
	let ids = $state<string[]>([])
	let pending = $state(false)
	let uploadError = $state<ApiError | null>(null)
	const error = $derived(uploadError ?? serverError)
	const failed = $derived(uploadError !== null)
	let type = $state<'post' | 'reel' | 'story'>('post')
	async function choose(event: Event) {
		const files = [...((event.currentTarget as HTMLInputElement).files ?? [])]
		pending = true
		uploadError = null
		ids = []
		try {
			if (files.length > (type === 'post' ? 10 : 1))
				throw new ApiError('VALIDATION_FAILED', { fields: { mediaIds: 'TOO_MANY' } })
			for (const file of files) ids = [...ids, (await uploadFile(file, type)).id]
		} catch (caught) {
			uploadError = caught instanceof ApiError ? caught : new ApiError('INTERNAL')
			ids = []
		} finally {
			pending = false
		}
	}
</script>

<section class="panel" id="create">
	<form method="POST" action={type === 'story' ? '?/story' : '?/post'} class="grid gap-4">
		<label class="grid gap-2"
			>{$_('post.type')}<select bind:value={type} disabled={pending || ids.length > 0}
				><option value="post">{$_('profile.posts')}</option><option value="reel"
					>{$_('nav.reels')}</option
				><option value="story">{$_('story.title')}</option></select
			></label
		>
		<input type="hidden" name="type" value={type} />
		{#if type !== 'story'}<label class="grid gap-2"
				>{$_('post.caption')}<textarea
					name="caption"
					rows="4"
					required={ids.length === 0}
					aria-invalid={error?.fields?.caption ? 'true' : undefined}
					aria-describedby={error?.fields?.caption ? 'composer-caption-error' : undefined}
					class="w-full resize-y rounded-xl border border-line p-3"></textarea><FieldError
					code={error?.fields?.caption}
					id="composer-caption-error"
				/></label
			>{/if}
		<label class="grid gap-2"
			>{$_('post.media')}<input
				type="file"
				accept={type === 'reel'
					? 'video/mp4,video/webm'
					: 'image/jpeg,image/png,image/webp,video/mp4,video/webm'}
				multiple={type === 'post'}
				disabled={pending}
				onchange={choose}
				aria-invalid={error?.fields?.mediaIds ? 'true' : undefined}
				aria-describedby={error?.fields?.mediaIds ? 'composer-media-error' : undefined}
			/><FieldError code={error?.fields?.mediaIds} id="composer-media-error" /></label
		>
		{#each ids as id}<input type="hidden" name="mediaId" value={id} />{/each}
		{#if type === 'story'}<p class="text-fg-muted">{$_('story.expires')}</p>{/if}
		{#if pending}<p role="status">{$_('post.uploading')}</p>{/if}
		{#if error}<p role="alert">{$_(errorMessageKey(error.code))}</p>{/if}
		<Button
			type="submit"
			variant="primary"
			disabled={pending || failed || (type !== 'post' && ids.length !== 1)}
			>{$_('post.publish')}</Button
		>
	</form>
</section>

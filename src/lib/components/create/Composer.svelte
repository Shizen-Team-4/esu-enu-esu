<script lang="ts">
	import { onDestroy } from 'svelte'
	import { _ } from 'svelte-i18n'
	import { ApiError } from '$lib/api/api-error'
	import type { ErrorEnvelope, UserSummary } from '$lib/contract'
	import { canPublish, maxFiles } from '$lib/create/composer-state'
	import type { ComposerType } from '$lib/create/initial-post-type'
	import type { MediaItem } from '$lib/create/media-item'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { uploadFile } from '$lib/media/upload-file'
	import FieldError from '$lib/components/FieldError.svelte'
	import ComposerAuthor from './ComposerAuthor.svelte'
	import ComposerMediaPreview from './ComposerMediaPreview.svelte'
	import ComposerToolbar from './ComposerToolbar.svelte'
	import CreateHeader from './CreateHeader.svelte'

	type Props = {
		me: UserSummary | null
		error?: ErrorEnvelope['error']
		initialType?: ComposerType
		lockType?: boolean
	}
	let { me, error: serverError, initialType = 'post', lockType = false }: Props = $props()

	// svelte-ignore state_referenced_locally
	let type = $state<ComposerType>(initialType)
	let caption = $state('')
	let items = $state<MediaItem[]>([])
	let limitError = $state<ApiError | null>(null)
	let counter = 0

	const uploading = $derived(items.some((item) => item.status === 'uploading'))
	const failedItem = $derived(items.find((item) => item.status === 'failed'))
	const error = $derived(limitError ?? failedItem?.error ?? serverError)
	const ready = $derived(items.filter((item) => item.status === 'ready'))
	const canPost = $derived(
		canPublish({
			type,
			caption,
			mediaCount: items.length,
			uploading,
			failed: failedItem !== undefined,
		}),
	)
	const pickDisabled = $derived(uploading || items.length >= maxFiles(type))

	function patch(key: string, change: Partial<MediaItem>) {
		items = items.map((item) => (item.key === key ? { ...item, ...change } : item))
	}

	async function upload(item: MediaItem) {
		try {
			const result = await uploadFile(item.file, type)
			patch(item.key, { status: 'ready', id: result.id })
		} catch (caught) {
			const failure = caught instanceof ApiError ? caught : new ApiError('INTERNAL')
			patch(item.key, { status: 'failed', error: failure })
		}
	}

	function pick(files: File[]) {
		limitError = null
		if (items.length + files.length > maxFiles(type)) {
			limitError = new ApiError('VALIDATION_FAILED', { fields: { mediaIds: 'TOO_MANY' } })
			return
		}
		const added = files.map<MediaItem>((file) => ({
			key: `media-${counter++}`,
			file,
			url: URL.createObjectURL(file),
			status: 'uploading',
		}))
		items = [...items, ...added]
		added.forEach((item) => void upload(item))
	}

	function remove(item: MediaItem) {
		URL.revokeObjectURL(item.url)
		items = items.filter((candidate) => candidate.key !== item.key)
		limitError = null
	}

	onDestroy(() => items.forEach((item) => URL.revokeObjectURL(item.url)))
</script>

<CreateHeader {canPost} {type} />
<div
	class="mx-auto w-full max-w-[620px] pb-[calc(var(--composer-toolbar-height,5rem)+env(safe-area-inset-bottom))] md:my-8 md:pb-0"
>
	<h1 class="mb-4 hidden text-xl font-semibold md:block">
		{$_(type === 'story' ? 'story.add' : 'create.title')}
	</h1>
	<form
		id="composer-form"
		method="POST"
		action={type === 'story' ? '?/story' : '?/post'}
		class="grid gap-4 bg-surface p-3.5 md:border md:border-line md:p-6"
	>
		<ComposerAuthor {me} bind:type locked={lockType || items.length > 0} />
		<input type="hidden" name="type" value={type} />
		{#each ready as item (item.key)}<input type="hidden" name="mediaId" value={item.id} />{/each}
		{#if type === 'story'}
			<p class="text-fg-muted">{$_('story.expires')}</p>
		{:else}
			<label class="grid gap-2">
				<span class="sr-only">{$_('post.caption')}</span>
				<textarea
					name="caption"
					bind:value={caption}
					placeholder={$_('create.placeholder')}
					aria-invalid={error?.fields?.caption ? 'true' : undefined}
					aria-describedby={error?.fields?.caption ? 'composer-caption-error' : undefined}
					class="min-h-[150px] w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed text-fg outline-none placeholder:text-fg-muted md:min-h-[130px]"
				></textarea>
				<FieldError code={error?.fields?.caption} id="composer-caption-error" />
			</label>
		{/if}
		<ComposerMediaPreview {items} onremove={remove} />
		<FieldError code={error?.fields?.mediaIds} id="composer-media-error" />
		{#if error}<p role="alert" class="text-danger">{$_(errorMessageKey(error.code))}</p>{/if}
		<ComposerToolbar
			{type}
			{caption}
			{canPost}
			disabled={pickDisabled}
			multiple={maxFiles(type) > 1}
			onchange={pick}
		/>
	</form>
	<p class="mt-3 hidden text-meta text-fg-muted md:block">{$_('create.hint')}</p>
</div>

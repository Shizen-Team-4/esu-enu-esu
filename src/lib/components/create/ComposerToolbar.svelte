<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { CAPTION_MAX } from '$lib/contract'
	import { acceptFor } from '$lib/create/composer-state'
	import type { ComposerType } from '$lib/create/initial-post-type'
	import { isOver, remaining } from '$lib/format/char-count'
	import Button from '$lib/components/ui/Button.svelte'
	import IconButton from '$lib/components/ui/IconButton.svelte'

	type Props = {
		type: ComposerType
		caption: string
		disabled: boolean
		canPost: boolean
		multiple: boolean
		onchange: (files: File[]) => void
	}
	let { type, caption, disabled, canPost, multiple, onchange }: Props = $props()

	let photoInput = $state<HTMLInputElement>()
	let videoInput = $state<HTMLInputElement>()
	const left = $derived(remaining(caption, CAPTION_MAX))
	const over = $derived(isOver(caption, CAPTION_MAX))

	function picked(event: Event) {
		const input = event.currentTarget as HTMLInputElement
		onchange([...(input.files ?? [])])
		input.value = ''
	}
</script>

<div
	class="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-3.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:static md:border-t md:px-0 md:pb-0"
>
	<div class="flex items-center">
		{#if type !== 'reel'}
			<IconButton label={$_('create.addPhoto')} {disabled} onclick={() => photoInput?.click()}>
				<svg
					viewBox="0 0 24 24"
					class="size-6"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
					><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path
						d="m21 15-4-4-9 9"
					/></svg
				>
			</IconButton>
			<input
				bind:this={photoInput}
				type="file"
				class="hidden"
				accept={acceptFor(type, 'image')}
				{multiple}
				onchange={picked}
			/>
		{/if}
		<IconButton label={$_('create.addVideo')} {disabled} onclick={() => videoInput?.click()}>
			<svg
				viewBox="0 0 24 24"
				class="size-6"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
				><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m22 8-6 4 6 4Z" /></svg
			>
		</IconButton>
		<input
			bind:this={videoInput}
			type="file"
			class="hidden"
			accept={acceptFor(type, 'video')}
			{multiple}
			onchange={picked}
		/>
	</div>
	{#if type !== 'story'}
		<span
			class="text-meta {over ? 'font-semibold text-danger' : 'text-fg-muted'}"
			aria-live="polite"
			>{over
				? $_('create.over', { values: { count: -left } })
				: $_('create.remaining', { values: { count: left } })}</span
		>
	{/if}
	<Button
		type="submit"
		form="composer-form"
		variant="primary"
		disabled={!canPost}
		class="max-md:hidden">{$_(type === 'story' ? 'story.share' : 'post.publish')}</Button
	>
</div>

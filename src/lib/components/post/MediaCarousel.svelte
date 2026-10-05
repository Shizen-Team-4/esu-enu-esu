<script lang="ts">
	import { _ } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import type { Media } from '$lib/contract'
	import {
		counterValues,
		hasNext,
		hasPrevious,
		nextIndex,
		previousIndex,
	} from '$lib/media/carousel-index'
	import NavIcon from '$lib/components/NavIcon.svelte'

	let { media }: { media: Media[] } = $props()
	let index = $state(0)
	const item = $derived(media[Math.min(index, media.length - 1)])
	const many = $derived(media.length > 1)

	function onkeydown(event: KeyboardEvent) {
		if (!many) return
		if (event.key === 'ArrowRight') index = nextIndex(index, media.length)
		if (event.key === 'ArrowLeft') index = previousIndex(index)
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="post-media relative flex justify-center overflow-hidden rounded-control border border-line bg-background"
	role="group"
	aria-roledescription="carousel"
	aria-label={$_('carousel.label')}
	tabindex={many ? 0 : undefined}
	{onkeydown}
>
	{#key item.id}
		{#if item.type === 'image'}
			<img
				src={item.url}
				width={item.width}
				height={item.height}
				alt=""
				loading="lazy"
				class="max-h-(--media-max-height) w-full object-contain"
			/>
		{:else}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={item.url}
				poster={item.thumbnailUrl ?? undefined}
				width={item.width}
				height={item.height}
				controls
				preload="metadata"
				class="max-h-(--media-max-height) w-full object-contain"
			></video>
		{/if}
	{/key}
	{#if many}
		<span class="sr-only" aria-live="polite" aria-atomic="true"
			>{$_('carousel.counter', { values: counterValues(index, media.length) })}</span
		>
		{#if hasPrevious(index)}
			<IconButton
				label={$_('carousel.previous')}
				class="absolute top-1/2 left-2 -translate-y-1/2 border border-line bg-surface"
				onclick={() => (index = previousIndex(index))}
				><NavIcon path="M15 18l-6-6 6-6" /></IconButton
			>
		{/if}
		{#if hasNext(index, media.length)}
			<IconButton
				label={$_('carousel.next')}
				class="absolute top-1/2 right-2 -translate-y-1/2 border border-line bg-surface"
				onclick={() => (index = nextIndex(index, media.length))}
				><NavIcon path="M9 18l6-6-6-6" /></IconButton
			>
		{/if}
		<span
			class="absolute top-2 right-2 rounded-full border border-line bg-surface px-2 text-meta text-fg"
			>{$_('carousel.counter', { values: counterValues(index, media.length) })}</span
		>
	{/if}
</div>

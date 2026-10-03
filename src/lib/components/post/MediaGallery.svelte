<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left'
	import ChevronRight from '@lucide/svelte/icons/chevron-right'
	import { _ } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { frameRatio } from '$lib/posts/aspect-ratio'
	import { nextIndex, prevIndex, swipeDirection } from '$lib/posts/gallery-index'
	import type { Media } from '$lib/types/media'
	import MediaItem from './MediaItem.svelte'

	const SWIPE_THRESHOLD_PX = 50

	let { media, alt = '' }: { media: Media[]; alt?: string } = $props()

	let index = $state(0)
	let start: { x: number; y: number } | null = null

	const total = $derived(media.length)
	const ratio = $derived(frameRatio(media[0]))

	const next = () => (index = nextIndex(index, total))
	const prev = () => (index = prevIndex(index))

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') next()
		else if (event.key === 'ArrowLeft') prev()
	}

	function onPointerUp(event: PointerEvent) {
		if (!start) return
		const direction = swipeDirection(
			event.clientX - start.x,
			event.clientY - start.y,
			SWIPE_THRESHOLD_PX,
		)
		start = null
		if (direction === 'next') next()
		else if (direction === 'prev') prev()
	}
</script>

<!-- The frame is focusable so ArrowLeft/ArrowRight work from the keyboard -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<div
	role="group"
	aria-roledescription="carousel"
	aria-label={$_('media.gallery')}
	tabindex="0"
	class="relative touch-pan-y overflow-hidden bg-muted select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
	style:aspect-ratio={ratio}
	onkeydown={onKeydown}
	onpointerdown={(event) => (start = { x: event.clientX, y: event.clientY })}
	onpointerup={onPointerUp}
	onpointercancel={() => (start = null)}
>
	<div
		class="flex size-full transition-transform duration-300"
		style:transform="translateX(-{index * 100}%)"
	>
		{#each media as item, slide (item.id)}
			<div
				role="group"
				aria-roledescription="slide"
				aria-label={$_('media.position', { values: { current: slide + 1, total } })}
				aria-hidden={slide !== index}
				inert={slide !== index}
				class="size-full shrink-0"
			>
				<MediaItem media={item} {alt} />
			</div>
		{/each}
	</div>

	<span
		aria-live="polite"
		class="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white tabular-nums"
	>
		{$_('media.position', { values: { current: index + 1, total } })}
	</span>

	<IconButton
		icon={ChevronLeft}
		label={$_('media.previous')}
		disabled={index === 0}
		onclick={prev}
		class="absolute top-1/2 left-2 size-8 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
	/>
	<IconButton
		icon={ChevronRight}
		label={$_('media.next')}
		disabled={index === total - 1}
		onclick={next}
		class="absolute top-1/2 right-2 size-8 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
	/>
</div>

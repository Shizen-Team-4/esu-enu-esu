<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause'
	import Play from '@lucide/svelte/icons/play'
	import { _ } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { formatDuration } from '$lib/media/format-duration'
	import { inView } from '$lib/media/in-view'
	import type { Media } from '$lib/types/media'

	let { media }: { media: Media } = $props()

	let video = $state<HTMLVideoElement>()
	let paused = $state(true)
	let currentTime = $state(0)
	let duration = $state(Number.NaN)

	const total = $derived(Number.isFinite(duration) ? duration : (media.durationSec ?? 0))

	function toggle() {
		if (!video) return
		if (paused) {
			// play() rejects when the browser blocks it; keep the button in the paused state
			video.play().catch(() => (paused = true))
		} else {
			video.pause()
		}
	}

	const pause = () => video?.pause()

	/** Pauses the video when the component is destroyed. */
	const pauseOnDestroy = (element: HTMLVideoElement) => () => element.pause()
</script>

<div class="relative size-full bg-black">
	<!-- Captions are not part of the data contract yet -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		bind:currentTime
		bind:duration
		src={media.url}
		poster={media.thumbnailUrl ?? undefined}
		preload="metadata"
		playsinline
		class="size-full object-contain"
		onplay={() => (paused = false)}
		onpause={() => (paused = true)}
		onended={() => (paused = true)}
		{@attach inView({ onLeave: pause })}
		{@attach pauseOnDestroy}
	></video>
	<div
		class="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 text-white"
	>
		<IconButton
			icon={paused ? Play : Pause}
			label={paused ? $_('video.play') : $_('video.pause')}
			onclick={toggle}
			class="text-white hover:bg-white/20"
		/>
		<span class="text-xs tabular-nums">
			{formatDuration(currentTime)} / {formatDuration(total)}
		</span>
	</div>
</div>

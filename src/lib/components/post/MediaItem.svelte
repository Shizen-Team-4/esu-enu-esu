<script lang="ts">
	import type { Media } from '$lib/types/media'
	import MediaImage from './MediaImage.svelte'
	import VideoPlayer from './VideoPlayer.svelte'

	let { media, alt = '' }: { media: Media; alt?: string } = $props()
</script>

{#if media.type === 'video'}
	<VideoPlayer {media} />
{:else}
	<MediaImage {media} {alt} />
{/if}

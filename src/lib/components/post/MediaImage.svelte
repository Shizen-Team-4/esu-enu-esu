<script lang="ts">
	import ImageOff from '@lucide/svelte/icons/image-off'
	import { _ } from 'svelte-i18n'
	import Icon from '$lib/components/ui/Icon.svelte'
	import type { Media } from '$lib/types/media'

	let { media, alt = '' }: { media: Media; alt?: string } = $props()

	let failed = $state(false)
</script>

{#if failed}
	<div
		role="img"
		aria-label={$_('media.loadFailed')}
		class="flex size-full flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground"
	>
		<Icon icon={ImageOff} size={32} />
		<span aria-hidden="true">{$_('media.loadFailed')}</span>
	</div>
{:else}
	<!-- width/height give the browser the aspect ratio before the file loads -->
	<img
		src={media.url}
		{alt}
		width={media.width}
		height={media.height}
		loading="lazy"
		decoding="async"
		class="size-full object-contain"
		onerror={() => (failed = true)}
	/>
{/if}

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { MediaItem } from '$lib/create/media-item'
	let { items, onremove }: { items: MediaItem[]; onremove: (item: MediaItem) => void } = $props()
</script>

{#if items.length > 0}
	<ul class="m-0 grid list-none gap-3 p-0" aria-label={$_('create.preview')}>
		{#each items as item, i (item.key)}
			<li class="relative flex max-h-[28rem] justify-center overflow-hidden rounded-xl bg-elevated">
				{#if item.file.type.startsWith('video/')}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						src={item.url}
						muted
						playsinline
						controls
						class="max-h-[28rem] max-w-full object-contain"
					></video>
				{:else}
					<img src={item.url} alt="" class="max-h-[28rem] max-w-full object-contain" />
				{/if}
				<button
					type="button"
					aria-label="{$_('create.removeMedia')} {i + 1}"
					onclick={() => onremove(item)}
					class="absolute top-2 right-2 inline-grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-surface text-fg"
				>
					<svg
						viewBox="0 0 24 24"
						class="size-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg
					>
				</button>
				{#if item.status !== 'ready'}
					<span
						role="status"
						class="absolute bottom-2 left-2 rounded-control border border-line bg-surface px-2 py-1 text-meta {item.status ===
						'failed'
							? 'text-danger'
							: 'text-fg-muted'}"
						>{item.status === 'failed' ? $_('create.failedItem') : $_('create.uploadingItem')}</span
					>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

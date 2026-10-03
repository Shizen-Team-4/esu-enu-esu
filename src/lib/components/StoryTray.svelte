<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { StoryTrayItem } from '$lib/contract'
	let { items }: { items: StoryTrayItem[] } = $props()
</script>

<section aria-label={$_('story.title')} class="mb-6 flex gap-4 overflow-x-auto py-2">
	{#each items as item (item.user.id)}
		<a
			href="/stories/{encodeURIComponent(item.user.username || item.user.id)}"
			class="grid min-w-20 justify-items-center gap-2 text-sm text-fg"
		>
			<div
				class="grid size-16 place-items-center rounded-full border-2 p-1 {item.hasUnseen
					? 'border-primary'
					: 'border-line'}"
			>
				{#if item.user.avatarUrl}<img
						src={item.user.avatarUrl}
						width="56"
						height="56"
						alt=""
						class="size-full rounded-full object-cover"
					/>{:else}<span class="grid size-full place-items-center rounded-full bg-bubble-in text-lg"
						>{item.user.displayName.slice(0, 1)}</span
					>{/if}
			</div>
			<span class="max-w-24 truncate">{item.user.username || item.user.displayName}</span>
		</a>
	{/each}
</section>

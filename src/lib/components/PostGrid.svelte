<script lang="ts">
	import type { Post } from '$lib/contract'
	let { posts }: { posts: Post[] } = $props()
</script>

<div class="grid grid-cols-3 gap-0.5 md:gap-1">
	{#each posts as post (post.id)}
		<a
			href={post.shareUrl}
			class="relative grid aspect-square min-w-0 place-items-center overflow-hidden bg-surface text-fg"
		>
			{#if post.media[0]?.type === 'image'}<img
					src={post.media[0].url}
					width={post.media[0].width}
					height={post.media[0].height}
					alt={post.caption}
					loading="lazy"
					class="h-full w-full object-cover"
				/>
			{:else if post.media[0]?.thumbnailUrl}<img
					src={post.media[0].thumbnailUrl}
					width={post.media[0].width}
					height={post.media[0].height}
					alt={post.caption}
					loading="lazy"
					class="h-full w-full object-cover"
				/>
			{:else}<span class="line-clamp-4 break-words p-2 text-sm">{post.caption}</span>{/if}
			{#if post.type === 'reel'}<span
					class="absolute right-2 bottom-2 rounded bg-surface p-1"
					aria-hidden="true">▶</span
				>{/if}
		</a>
	{/each}
</div>

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import { tileKind } from '$lib/profile/tile-kind'
	let { posts }: { posts: Post[] } = $props()

	const name = (post: Post) =>
		post.caption || $_(post.type === 'reel' ? 'profile.reel' : 'profile.photoPost')
</script>

<ul class="m-0 grid list-none grid-cols-3 gap-[3px] p-0">
	{#each posts as post (post.id)}
		{@const tile = tileKind(post.media[0])}
		<li class="min-w-0">
			<a
				href={post.shareUrl}
				aria-label={name(post)}
				class="relative grid aspect-square place-items-center overflow-hidden text-fg no-underline bg-elevated"
			>
				{#if tile.kind === 'text'}
					<span class="line-clamp-5 break-words p-4 text-center text-meta md:text-body"
						>{post.caption}</span
					>
				{:else}
					<img
						src={tile.url}
						width={post.media[0].width}
						height={post.media[0].height}
						alt=""
						loading="lazy"
						class="size-full object-contain"
					/>
				{/if}
				{#if post.type === 'reel'}
					<svg
						viewBox="0 0 24 24"
						class="absolute top-2 right-2 size-5 text-fg"
						fill="currentColor"
						aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg
					>
				{/if}
			</a>
		</li>
	{/each}
</ul>

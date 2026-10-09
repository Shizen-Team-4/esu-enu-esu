<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import { tileKind } from '$lib/profile/tile-kind'
	let { posts }: { posts: Post[] } = $props()

	const contentKind = (post: Post, kind: ReturnType<typeof tileKind>['kind']) =>
		post.type === 'reel'
			? 'reel'
			: kind === 'text'
				? 'status'
				: kind === 'image'
					? 'picture'
					: 'video'
	const label = (kind: ReturnType<typeof contentKind>) =>
		$_(
			kind === 'reel'
				? 'profile.reel'
				: kind === 'status'
					? 'profile.status'
					: kind === 'picture'
						? 'profile.photoPost'
						: 'profile.videoPost',
		)
</script>

<ul class="m-0 grid list-none grid-cols-2 gap-[3px] p-0 sm:grid-cols-3">
	{#each posts as post (post.id)}
		{@const tile = tileKind(post.media[0])}
		{@const kind = contentKind(post, tile.kind)}
		<li class="min-w-0">
			<a
				href={post.type === 'reel' ? `/reels?post=${encodeURIComponent(post.id)}` : `/p/${post.id}`}
				aria-label="{label(kind)}: {post.caption || post.author.displayName}"
				data-kind={kind}
				class="relative flex aspect-square min-w-0 flex-col overflow-hidden text-fg no-underline {tile.kind ===
				'text'
					? 'bg-secondary-soft'
					: tile.kind === 'video'
						? 'bg-black text-white'
						: 'bg-elevated'}"
			>
				{#if tile.kind === 'text'}
					<span class="px-3 pt-3 text-xs font-semibold text-secondary md:px-4 md:pt-4"
						>{$_('profile.status')}</span
					>
					<span
						class="my-auto line-clamp-4 break-words px-3 py-2 text-sm font-semibold text-fg md:px-4 md:text-base"
						>{post.caption || $_('profile.status')}</span
					>
				{:else if tile.kind !== 'video'}
					<img
						src={tile.url}
						width={post.media[0].width}
						height={post.media[0].height}
						alt=""
						loading="lazy"
						class="size-full object-cover"
					/>
				{/if}
				{#if kind === 'reel' || kind === 'video'}
					<svg
						viewBox="0 0 24 24"
						class="absolute top-3 right-3 size-6 text-white drop-shadow-md"
						fill="currentColor"
						aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg
					>
					<span
						class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent px-3 pt-7 pb-2 text-xs font-semibold text-white"
						>{label(kind)}</span
					>
				{:else if kind === 'picture'}
					<span
						class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent px-3 pt-7 pb-2 text-xs font-semibold text-white"
						>{$_('profile.photoPost')}</span
					>
				{/if}
			</a>
		</li>
	{/each}
</ul>

<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<main class="container grid gap-4 py-8" style="max-width: 630px">
	<h1>{$_('nav.reels')}</h1>
	{#each data.reels.items as post (post.id)}<PostCard
			{post}
		/>{/each}{#if !data.reels.items.length}<p>
			{$_('feed.empty')}
		</p>{/if}{#if data.reels.nextCursor}<a class="button" href="?cursor={data.reels.nextCursor}"
			>{$_('feed.more')}</a
		>{/if}
</main>

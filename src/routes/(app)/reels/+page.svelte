<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import PostCard from '$lib/components/post/PostCard.svelte'
	import HatchBand from '$lib/components/ui/HatchBand.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<svelte:head><title>{$_('nav.reels')} · {$_('app.name')}</title></svelte:head>
<div class="grid gap-4 py-4">
	<h1 class="text-title font-semibold">{$_('nav.reels')}</h1>
	<div class="post-list">
		{#each data.reels.items as post, index (post.id)}
			{#if index > 0}<HatchBand />{/if}
			<PostCard {post} />
		{/each}
	</div>
	{#if !data.reels.items.length}<p>
			{$_('feed.empty')}
		</p>{/if}{#if data.reels.nextCursor}<Button href="?cursor={data.reels.nextCursor}"
			>{$_('feed.more')}</Button
		>{/if}
</div>

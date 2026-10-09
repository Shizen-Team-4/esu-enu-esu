<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import ReelCard from '$lib/components/reels/ReelCard.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<svelte:head><title>{$_('nav.reels')} · {$_('app.name')}</title></svelte:head>
<div class="reels-stage" role="region" aria-label={$_('nav.reels')}>
	<h1 class="sr-only">{$_('nav.reels')}</h1>
	{#each data.reels.items as post (post.id)}<ReelCard {post} loggedIn={Boolean(data.me)} />{/each}
	{#if !data.reels.items.length}<div class="message-empty">
			<h2 class="mb-3 text-xl font-semibold">{$_('nav.reels')}</h2>
			<p class="mb-5 text-fg-muted">{$_('reels.empty')}</p>
			<Button href="/create?type=reel" variant="primary">{$_('nav.create')}</Button>
		</div>{/if}
	{#if data.reels.nextCursor}<div class="grid place-items-center p-8">
			<Button href="?cursor={data.reels.nextCursor}">{$_('feed.more')}</Button>
		</div>{/if}
</div>

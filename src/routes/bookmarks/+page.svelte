<script lang="ts">
	import PostGrid from '$lib/components/PostGrid.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<svelte:head><title>{$_('bookmarks.title')}</title></svelte:head>
<main class="container grid gap-4 py-8" style="max-width: 935px">
	<h1>{$_('bookmarks.title')}</h1>
	{#if data.saved.items.length}
		<PostGrid posts={data.saved.items} />
	{:else}
		<p>{$_('bookmarks.empty')}</p>
	{/if}
	{#if data.saved.nextCursor}<a class="button" href="?cursor={data.saved.nextCursor}"
			>{$_('feed.more')}</a
		>{/if}
</main>

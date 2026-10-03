<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import PostGrid from '$lib/components/profile/PostGrid.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<svelte:head><title>{$_('bookmarks.title')} · {$_('app.name')}</title></svelte:head>
<div class="grid gap-4 py-4">
	<h1 class="text-title font-semibold">{$_('bookmarks.title')}</h1>
	{#if data.saved.items.length}
		<PostGrid posts={data.saved.items} />
	{:else}
		<p>{$_('bookmarks.empty')}</p>
	{/if}
	{#if data.saved.nextCursor}<Button href="?cursor={data.saved.nextCursor}"
			>{$_('feed.more')}</Button
		>{/if}
</div>

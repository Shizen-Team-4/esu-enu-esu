<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PostCard from '$lib/components/PostCard.svelte'
	import StoryTray from '$lib/components/StoryTray.svelte'
	let { data } = $props()
</script>

<svelte:head><title>{$_('app.name')}</title></svelte:head>
<div>
	<h1 class="text-title font-semibold">{data.user.name}</h1>
	<StoryTray items={data.stories.items} />
	<div class="feed">
		{#each data.feed.items as post (post.id)}<PostCard {post} interactive />{/each}
	</div>
</div>

<style>
	.feed {
		display: grid;
		gap: 1rem;
		margin-block: 1.5rem;
	}
</style>

<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte'
	import StoryTray from '$lib/components/StoryTray.svelte'
	let { data } = $props()
</script>

<svelte:head><title>SNS</title></svelte:head>
<main class="container">
	<header>
		<a class="button" href="/">SNS</a>
		<h1>{data.user.name}</h1>
	</header>
	<StoryTray items={data.stories.items} />
	<div class="feed">
		{#each data.feed.items as post (post.id)}<PostCard {post} interactive />{/each}
	</div>
</main>

<style>
	main {
		padding-block: 2rem;
	}
	.feed {
		display: grid;
		gap: 1rem;
		margin-block: 1.5rem;
		max-width: 36rem;
	}
</style>

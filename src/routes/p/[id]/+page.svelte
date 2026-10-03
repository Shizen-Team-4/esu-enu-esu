<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte'
	let { data } = $props()
</script>

<main class="container"><a class="button" href="/">SNS</a><PostCard post={data.post} /></main>

<style>
	main {
		max-width: 44rem;
		padding-block: 2rem;
		display: grid;
		gap: 1rem;
	}
</style>

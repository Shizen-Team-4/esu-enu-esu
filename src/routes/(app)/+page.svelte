<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import PostCard from '$lib/components/PostCard.svelte'
	let { data } = $props()
</script>

<svelte:head><title>{$_('app.name')}</title></svelte:head>

<div>
	<section class="panel">
		<h1 class="text-title font-semibold">{$_('app.name')}</h1>
		<p>{$_('home.description')}</p>
		<Button href="/login">{$_('auth.login')}</Button>
	</section>
	<div class="feed">
		{#each data.feed.items as post (post.id)}<PostCard {post} />{/each}
	</div>
</div>

<style>
	div {
		padding-block: 1.5rem;
	}
	p {
		line-height: 1.7;
	}
	.feed {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
	}
</style>

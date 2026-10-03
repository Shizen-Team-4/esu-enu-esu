<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PostCard from '$lib/components/PostCard.svelte'
	let { data } = $props()
</script>

<svelte:head><title>SNS</title></svelte:head>

<header class="container"><a href="/" aria-label="SNS">SNS</a></header>
<main class="container">
	<section class="panel">
		<h1>SNS</h1>
		<p>{$_('home.description')}</p>
		<a class="button" href="/login">{$_('auth.login')}</a>
	</section>
	<div class="feed">
		{#each data.feed.items as post (post.id)}<PostCard {post} />{/each}
	</div>
</main>

<style>
	header {
		padding-block: 1.5rem;
		font-weight: 700;
	}
	header a {
		display: inline-flex;
		min-height: 44px;
		align-items: center;
	}
	main {
		padding-block: clamp(2rem, 8vw, 6rem);
	}
	section {
		max-width: 44rem;
		margin-inline: auto;
	}
	p {
		line-height: 1.7;
	}
	.feed {
		display: grid;
		gap: 1rem;
		max-width: 44rem;
		margin: 2rem auto;
	}
</style>

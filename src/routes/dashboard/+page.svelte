<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PostCard from '$lib/components/PostCard.svelte'
	import Composer from '$lib/components/Composer.svelte'
	import StoryTray from '$lib/components/StoryTray.svelte'
	let { data, form } = $props()
</script>

<svelte:head><title>SNS</title></svelte:head>
<main
	class="container"
	style:color-scheme={data.preferences.theme === 'system' ? 'light dark' : data.preferences.theme}
>
	<header>
		<a class="button" href="/">SNS</a>
		<h1>{data.user.name}</h1>
	</header>
	<Composer />
	<StoryTray items={data.stories.items} />
	<div class="feed">
		{#each data.feed.items as post (post.id)}<PostCard {post} interactive />{/each}
	</div>
	<section class="panel">
		<h2>{$_('preferences.title')}</h2>
		<form method="POST" action="?/preferences">
			<label
				>{$_('preferences.theme')}
				<select name="theme" value={data.preferences.theme}>
					<option value="system">{$_('preferences.system')}</option>
					<option value="light">{$_('preferences.light')}</option>
					<option value="dark">{$_('preferences.dark')}</option>
				</select>
			</label>
			<label
				>{$_('preferences.language')}
				<select name="language" value={data.preferences.language}>
					<option value="en">English</option><option value="ja">日本語</option><option value="km"
						>ខ្មែរ</option
					>
				</select>
			</label>
			{#if form?.code}<p role="alert">{$_('preferences.error')}</p>{/if}
			<button type="submit">{$_('preferences.save')}</button>
		</form>
	</section>
</main>

<style>
	main {
		padding-block: 2rem;
	}
	section {
		max-width: 36rem;
	}
	form,
	label {
		display: grid;
		gap: 0.75rem;
	}
	form {
		gap: 1.5rem;
	}
	select {
		width: 100%;
		padding: 0.5rem;
		border-radius: 0.5rem;
	}
	.feed {
		display: grid;
		gap: 1rem;
		margin-block: 1.5rem;
		max-width: 36rem;
	}
	textarea {
		width: 100%;
		resize: vertical;
	}
</style>

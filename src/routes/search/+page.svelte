<script lang="ts">
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<main class="container py-8" style="max-width: 630px">
	<h1>{$_('nav.search')}</h1>
	<form class="my-6 flex gap-2">
		<input
			name="q"
			value={data.q}
			aria-label={$_('nav.search')}
			required
			maxlength="50"
			class="min-w-0 flex-1 rounded-xl border border-line p-3"
		/><button type="submit">{$_('nav.search')}</button>
	</form>
	{#if data.invalid}<p role="alert">{$_('auth.error')}</p>{/if}
	<ul class="grid gap-3">
		{#each data.results.items as user (user.id)}<li class="panel">
				<a href="/u/{user.username}"><strong>{user.displayName}</strong> @{user.username}</a>
			</li>{/each}
	</ul>
	{#if data.results.nextCursor}<a
			class="button"
			href="?q={encodeURIComponent(data.q)}&cursor={data.results.nextCursor}">{$_('feed.more')}</a
		>{/if}
</main>

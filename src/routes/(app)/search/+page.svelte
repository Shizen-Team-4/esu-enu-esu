<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	let { data } = $props()
</script>

<svelte:head><title>{$_('nav.search')} · {$_('app.name')}</title></svelte:head>
<div class="py-4">
	<h1 class="text-title font-semibold">{$_('nav.search')}</h1>
	<form class="my-6 flex gap-2">
		<input
			name="q"
			value={data.q}
			aria-label={$_('nav.search')}
			required
			maxlength="50"
			class="min-w-0 flex-1 rounded-xl border border-line p-3"
		/><Button type="submit" variant="primary">{$_('nav.search')}</Button>
	</form>
	{#if data.invalid}<p role="alert">{$_(errorMessageKey('VALIDATION_FAILED'))}</p>{/if}
	<ul class="grid gap-3">
		{#each data.results.items as user (user.id)}<li class="panel">
				<a href="/u/{user.username}"><strong>{user.displayName}</strong> @{user.username}</a>
			</li>{/each}
	</ul>
	{#if data.results.nextCursor}<Button
			href="?q={encodeURIComponent(data.q)}&cursor={data.results.nextCursor}"
			>{$_('feed.more')}</Button
		>{/if}
</div>

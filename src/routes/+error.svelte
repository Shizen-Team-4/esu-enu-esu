<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	const notFound = $derived(page.status === 404)
	const title = $derived(notFound ? 'errorPage.notFoundTitle' : 'errorPage.title')
</script>

<svelte:head><title>{$_(title)} · {$_('app.name')}</title></svelte:head>
<main
	class="mx-auto grid min-h-dvh max-w-auth content-center justify-items-center gap-4 px-gutter text-center"
>
	<p class="text-title font-semibold text-fg-muted">{page.status}</p>
	<h1 class="text-title font-semibold">{$_(title)}</h1>
	<p class="text-body text-fg-muted">
		{notFound ? $_('errorPage.notFound') : $_('errorPage.generic')}
	</p>
	<Button variant="primary" href="/">{$_('errorPage.home')}</Button>
</main>

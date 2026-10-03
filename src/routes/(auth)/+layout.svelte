<script lang="ts">
	import { _ } from 'svelte-i18n'
	let { children } = $props()
</script>

<main class="mx-auto grid min-h-dvh w-full max-w-auth content-start gap-6 px-gutter py-8">
	<a href="/" class="flex min-h-11 items-center text-title font-semibold text-fg no-underline"
		>{$_('app.name')}</a
	>
	{@render children()}
</main>

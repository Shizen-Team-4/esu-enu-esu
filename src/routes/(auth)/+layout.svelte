<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthShowcase from '$lib/components/auth/AuthShowcase.svelte'
	let { children } = $props()
</script>

<div class="grid min-h-dvh bg-surface md:grid-cols-2">
	<main class="flex flex-col px-gutter py-6 md:px-10">
		<a href="/" class="flex min-h-11 items-center gap-2 font-semibold text-fg no-underline">
			<span class="size-6 rounded-control bg-primary" aria-hidden="true"></span>{$_('app.name')}
		</a>
		<div class="m-auto grid w-full max-w-[360px] gap-6 py-8">
			{@render children()}
		</div>
		<p class="text-meta text-fg-muted">© {$_('app.name')}</p>
	</main>
	<AuthShowcase />
</div>

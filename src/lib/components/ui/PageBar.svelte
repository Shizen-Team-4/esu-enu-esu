<script lang="ts">
	import type { Snippet } from 'svelte'
	import { _ } from 'svelte-i18n'

	let { title, backHref, trailing }: { title: string; backHref: string; trailing?: Snippet } =
		$props()
</script>

<header
	class="-mx-gutter flex min-h-16 items-center gap-3 border-b border-line bg-surface px-gutter"
>
	<a
		href={backHref}
		aria-label={$_('common.back')}
		class="flex size-11 items-center justify-center text-fg no-underline"
	>
		<svg
			viewBox="0 0 24 24"
			class="size-6"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg
		>
	</a>
	<h1 class="flex-1 text-base font-semibold text-fg">{title}</h1>
	{#if trailing}{@render trailing()}{/if}
</header>

<script lang="ts">
	import { getContext, type Snippet } from 'svelte'
	import type { Readable } from 'svelte/store'
	import { _ } from 'svelte-i18n'
	import { BACK_HISTORY_CONTEXT, followHistoryBack } from '$lib/navigation/back-history'

	let { title, trailing, backTo }: { title?: string; trailing?: Snippet; backTo?: string } =
		$props()
	const backHref = getContext<Readable<string | null>>(BACK_HISTORY_CONTEXT)
	const href = $derived(backTo ?? $backHref)
</script>

{#if href || title || trailing}
	<header
		class="-mx-gutter flex min-h-16 items-center gap-3 border-b border-line bg-surface px-gutter"
	>
		{#if href}
			<a
				{href}
				onclick={backTo
					? undefined
					: (event) => followHistoryBack(event, () => window.history.back())}
				class="inline-flex min-h-11 items-center gap-3 text-base font-semibold text-fg no-underline"
			>
				<svg
					viewBox="0 0 24 24"
					class="size-6"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg
				>
				{$_('common.back')}
			</a>
		{/if}
		{#if title}<h1 class="flex-1 text-base font-semibold text-fg">{title}</h1>{/if}
		{#if trailing}{@render trailing()}{/if}
	</header>
{/if}

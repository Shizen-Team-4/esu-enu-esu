<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		header,
		children,
		nav,
	}: {
		header?: Snippet
		children: Snippet
		nav?: Snippet
	} = $props()
</script>

{#if header}
	{@render header()}
{/if}
<main
	class="min-h-dvh"
	style:padding-bottom={nav ? 'calc(var(--nav-height) + env(safe-area-inset-bottom))' : undefined}
>
	{@render children()}
</main>
{#if nav}
	{@render nav()}
{/if}

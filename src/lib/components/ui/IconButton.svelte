<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'

	type Props = {
		label: string
		href?: string
		class?: string
		children: Snippet
	} & Omit<HTMLButtonAttributes, 'class' | 'children'> &
		Omit<HTMLAnchorAttributes, 'class' | 'children' | 'type'>

	let { label, href, class: className = '', children, ...rest }: Props = $props()

	const classes = $derived(
		`inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent p-0 text-fg hover:bg-elevated ${className}`,
	)
</script>

{#if href}
	<a {href} aria-label={label} class={classes} {...rest as HTMLAnchorAttributes}
		>{@render children()}</a
	>
{:else}
	<button aria-label={label} class={classes} {...rest as HTMLButtonAttributes}
		>{@render children()}</button
	>
{/if}

<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'

	type Variant = 'primary' | 'secondary' | 'ghost'
	type Props = {
		variant?: Variant
		href?: string
		class?: string
		children: Snippet
	} & Omit<HTMLButtonAttributes, 'class' | 'children'> &
		Omit<HTMLAnchorAttributes, 'class' | 'children' | 'type'>

	let { variant = 'secondary', href, class: className = '', children, ...rest }: Props = $props()

	const variants: Record<Variant, string> = {
		primary: 'border-primary bg-primary text-on-primary',
		secondary: 'border-line bg-surface text-fg hover:bg-elevated',
		ghost: 'border-transparent bg-transparent text-fg hover:bg-elevated',
	}
	const base =
		'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border px-5 py-2 text-body no-underline disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:text-accent'
	const classes = $derived(`${base} ${variants[variant]} ${className}`)
</script>

{#if href}
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>{@render children()}</a>
{:else}
	<button class={classes} {...rest as HTMLButtonAttributes}>{@render children()}</button>
{/if}

<script lang="ts">
	import type { Snippet } from 'svelte'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import { cn } from '$lib/ui/class-names'
	import Icon from './Icon.svelte'

	type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
	type Size = 'sm' | 'md' | 'lg'

	let {
		variant = 'primary',
		size = 'md',
		href,
		type = 'button',
		loading = false,
		disabled = false,
		onclick,
		class: className,
		children,
	}: {
		variant?: Variant
		size?: Size
		href?: string
		type?: 'button' | 'submit' | 'reset'
		loading?: boolean
		disabled?: boolean
		onclick?: (event: MouseEvent) => void
		class?: string
		children: Snippet
	} = $props()

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-primary-foreground hover:opacity-90',
		secondary: 'bg-muted text-foreground hover:bg-border',
		ghost: 'bg-transparent text-foreground hover:bg-muted',
		destructive: 'bg-destructive text-white hover:opacity-90',
	}
	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base',
	}

	const inactive = $derived(disabled || loading)
	const classes = $derived(
		cn(
			'inline-flex items-center justify-center gap-2 rounded-base font-medium transition-colors',
			'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
			inactive && 'pointer-events-none opacity-50',
			variants[variant],
			sizes[size],
			className,
		),
	)
</script>

{#snippet content()}
	{#if loading}
		<Icon icon={LoaderCircle} size={16} class="animate-spin" />
	{/if}
	{@render children()}
{/snippet}

{#if href}
	<a
		{href}
		class={classes}
		aria-disabled={inactive || undefined}
		aria-busy={loading || undefined}
		tabindex={inactive ? -1 : undefined}
		onclick={(event) => (inactive ? event.preventDefault() : onclick?.(event))}
	>
		{@render content()}
	</a>
{:else}
	<button {type} class={classes} disabled={inactive} aria-busy={loading || undefined} {onclick}>
		{@render content()}
	</button>
{/if}

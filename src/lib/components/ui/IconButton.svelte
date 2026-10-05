<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { LucideIcon } from '@lucide/svelte'
	import { cn } from '$lib/ui/class-names'
	import Icon from './Icon.svelte'

	let {
		icon,
		label,
		pressed,
		disabled = false,
		onclick,
		class: className,
		children,
	}: {
		icon?: LucideIcon
		/** Required: becomes the accessible name. */
		label: string
		/** Sets aria-pressed for toggle buttons. */
		pressed?: boolean
		disabled?: boolean
		onclick?: (event: MouseEvent) => void
		class?: string
		children?: Snippet
	} = $props()
</script>

<button
	type="button"
	aria-label={label}
	aria-pressed={pressed}
	{disabled}
	{onclick}
	class={cn(
		'inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
		'disabled:pointer-events-none disabled:opacity-50',
		className,
	)}
>
	{#if icon}<Icon {icon} />{/if}
	{#if children}{@render children()}{/if}
</button>

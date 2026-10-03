<script lang="ts">
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
	}: {
		icon: LucideIcon
		/** Required: becomes the accessible name. */
		label: string
		/** Sets aria-pressed for toggle buttons. */
		pressed?: boolean
		disabled?: boolean
		onclick?: (event: MouseEvent) => void
		class?: string
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
	<Icon {icon} />
</button>

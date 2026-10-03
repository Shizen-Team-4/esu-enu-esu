<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte'

	let {
		icon: IconComponent,
		label,
		size = 20,
		class: className,
	}: {
		icon: LucideIcon
		/** Accessible name. Leave out for a decorative icon. */
		label?: string
		size?: number
		class?: string
	} = $props()
</script>

{#if label}
	<IconComponent {size} class={className} role="img" aria-label={label} />
{:else}
	<IconComponent {size} class={className} aria-hidden="true" />
{/if}

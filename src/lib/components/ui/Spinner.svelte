<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { cn } from '$lib/ui/class-names'

	let { class: className }: { class?: string } = $props()
</script>

<span role="status" class={cn('inline-flex items-center', className)}>
	<svg
		class="size-5 animate-spin text-muted-foreground"
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
		<path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
	</svg>
	<span class="sr-only">{$_('common.loading')}</span>
</span>

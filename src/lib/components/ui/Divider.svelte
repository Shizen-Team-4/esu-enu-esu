<script lang="ts">
	import { cn } from '$lib/ui/class-names'

	let { variant = 'solid', class: className }: { variant?: 'solid' | 'diagonal'; class?: string } =
		$props()
</script>

<div
	role="separator"
	class={cn(variant === 'diagonal' ? 'divider-diagonal' : 'h-px bg-border', className)}
></div>

<script lang="ts">
	import type { Snippet } from 'svelte'
	let { title, description, action }: { title: string; description?: string; action?: Snippet } =
		$props()
</script>

<div class="flex flex-col items-center gap-1 p-8 text-center">
	<p class="text-base font-medium">{title}</p>
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
	{#if action}{@render action()}{/if}
</div>

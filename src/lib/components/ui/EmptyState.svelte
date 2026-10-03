<script lang="ts">
	import type { Snippet } from 'svelte'
	let { title, description, action }: { title: string; description?: string; action?: Snippet } =
		$props()
</script>

<div class="grid justify-items-center gap-3 px-inset py-12 text-center">
	<p class="text-title font-semibold text-fg">{title}</p>
	{#if description}<p class="text-body text-fg-muted">{description}</p>{/if}
	{#if action}{@render action()}{/if}
</div>

<script lang="ts">
	let { title, description }: { title: string; description?: string } = $props()
</script>

<div class="flex flex-col items-center gap-1 p-8 text-center">
	<p class="text-base font-medium">{title}</p>
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
</div>

<script lang="ts">
	let { title, subtitle }: { title: string; subtitle: string } = $props()
</script>

<header class="grid gap-1">
	<h1 class="text-title font-semibold">{title}</h1>
	<p class="text-body text-fg-muted">{subtitle}</p>
</header>

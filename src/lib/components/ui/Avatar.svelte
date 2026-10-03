<script lang="ts">
	type Size = 'sm' | 'md' | 'lg'
	let {
		src = null,
		name,
		size = 'md',
	}: { src?: string | null; name: string; size?: Size } = $props()

	const sizes: Record<Size, string> = {
		sm: 'size-6 text-meta',
		md: 'size-9 text-body',
		lg: 'size-16 text-title',
	}
</script>

<span
	class="inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-bubble-in text-fg {sizes[
		size
	]}"
>
	{#if src}<img {src} alt="" class="size-full object-cover" />{:else}<span aria-hidden="true"
			>{name.slice(0, 1).toUpperCase()}</span
		>{/if}
</span>

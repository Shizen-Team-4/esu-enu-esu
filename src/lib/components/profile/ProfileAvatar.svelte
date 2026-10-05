<script lang="ts">
	let { src, name }: { src: string | null; name: string } = $props()
</script>

<div
	class="grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-title font-bold text-primary md:size-[132px] md:text-[48px]"
>
	{#if src}<img {src} alt="" class="size-full object-cover" />{:else}<span aria-hidden="true"
			>{name.slice(0, 1).toUpperCase()}</span
		>{/if}
</div>

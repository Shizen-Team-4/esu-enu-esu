<script lang="ts">
	import Toast from '$lib/components/ui/Toast.svelte'
	let { children } = $props()
</script>

<div class="min-h-dvh bg-surface md:bg-background">
	{@render children()}
	<Toast />
</div>

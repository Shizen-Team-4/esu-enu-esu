<script lang="ts">
	import '../app.css'
	import Navigation from '$lib/components/Navigation.svelte'
	import Header from '$lib/components/Header.svelte'
	let { children, data } = $props()
	$effect(() => {
		const query = window.matchMedia('(prefers-color-scheme: dark)')
		const apply = () =>
			document.documentElement.classList.toggle(
				'dark',
				data.theme === 'dark' || (data.theme === 'system' && query.matches),
			)
		apply()
		query.addEventListener('change', apply)
		return () => query.removeEventListener('change', apply)
	})
</script>

<Navigation />
<div class="shell md:ml-[72px] xl:ml-[240px]"><Header />{@render children()}</div>

<style>
	.shell {
		min-height: 100dvh;
		padding-bottom: calc(5rem + env(safe-area-inset-bottom));
	}
</style>

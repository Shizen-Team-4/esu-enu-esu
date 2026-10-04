<script lang="ts">
	import '../app.css'
	import NavigationHistory from '$lib/components/NavigationHistory.svelte'
	let { children, data } = $props()
	$effect(() => {
		document.documentElement.lang = data.lang
	})
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

<NavigationHistory>{@render children()}</NavigationHistory>

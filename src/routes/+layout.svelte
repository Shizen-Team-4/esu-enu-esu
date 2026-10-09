<script lang="ts">
	import '../app.css'
	import { applyTheme } from '$lib/theme/apply-theme'
	import NavigationHistory from '$lib/components/NavigationHistory.svelte'

	let { data, children } = $props()

	$effect(() => {
		const theme = data.theme
		const preference = window.matchMedia('(prefers-color-scheme: dark)')
		const update = () => applyTheme(theme, preference.matches)
		update()
		if (theme === 'system') preference.addEventListener('change', update)
		return () => preference.removeEventListener('change', update)
	})
</script>

<NavigationHistory>{@render children()}</NavigationHistory>

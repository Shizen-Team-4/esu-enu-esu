<script lang="ts">
	import '../app.css'

	let { children, data } = $props()

	$effect(() => {
		const root = document.documentElement
		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const applyTheme = () => {
			const dark = data.theme === 'dark' || (data.theme === 'system' && media.matches)
			root.dataset.theme = data.theme
			root.classList.toggle('dark', dark)
		}

		applyTheme()
		if (data.theme === 'system') media.addEventListener('change', applyTheme)
		return () => media.removeEventListener('change', applyTheme)
	})
</script>

{@render children()}

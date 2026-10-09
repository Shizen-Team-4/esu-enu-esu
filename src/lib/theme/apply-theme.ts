import type { Theme } from '$lib/server/preferences/domain/preferences'

export function applyTheme(
	theme: Theme,
	prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches,
) {
	const root = document.documentElement
	root.dataset.theme = theme
	root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark))
}

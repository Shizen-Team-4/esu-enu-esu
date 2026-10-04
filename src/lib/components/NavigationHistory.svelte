<script lang="ts">
	import { setContext, tick, type Snippet } from 'svelte'
	import { get, writable } from 'svelte/store'
	import { afterNavigate, beforeNavigate, replaceState } from '$app/navigation'
	import { page } from '$app/state'
	import { BACK_HISTORY_CONTEXT, resolveBackHref } from '$lib/navigation/back-history'
	import { readBackSnapshot, saveBackSnapshot } from '$lib/navigation/back-history-snapshot'
	import { readReplaceStateOption } from '$lib/navigation/replace-state-option'

	let { children }: { children: Snippet } = $props()
	const backHref = writable<string | null>(null)
	setContext(BACK_HISTORY_CONTEXT, backHref)
	let replacing: boolean | undefined

	beforeNavigate((navigation) => {
		replacing = undefined
		if (navigation.type !== 'link' && navigation.type !== 'form') return
		const target = navigation.event.target
		const source =
			target instanceof Element ? target.closest(navigation.type === 'link' ? 'a' : 'form') : null
		replacing = readReplaceStateOption(source)
	})

	afterNavigate(async (navigation) => {
		// Initial afterNavigate runs before the router allows replacing page state.
		await tick()
		const storage = () => window.sessionStorage
		const timing = performance.getEntriesByType('navigation')[0] as
			PerformanceNavigationTiming | undefined
		const previous = resolveBackHref({
			type: navigation.type,
			href: page.url.href,
			fromHref: navigation.from?.route.id ? navigation.from.url.href : null,
			previousHref: get(backHref),
			replaceState: replacing,
			restored: page.state.backHistory,
			reloaded: timing?.type === 'reload',
			snapshot: readBackSnapshot(storage),
		})
		backHref.set(previous)
		replaceState('', { ...page.state, backHistory: { backHref: previous } })
		saveBackSnapshot(storage, { href: page.url.href, backHref: previous })
	})
</script>

{@render children()}

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { onDestroy } from 'svelte'
	import { afterNavigate, goto } from '$app/navigation'
	import type { FollowListItem } from '$lib/contract'
	import { SEARCH_QUERY_MAX } from '$lib/contract/limits'
	import { debounce } from '$lib/search/debounce'
	import { fetchUserSearch } from '$lib/search/fetch-user-search'
	import { isStale, moveActiveIndex, normalizeQuery } from '$lib/search/search-dropdown'
	import SearchResults from './SearchResults.svelte'

	const uid = $props.id()
	const listId = `header-search-${uid}`
	let root = $state<HTMLElement>()
	let query = $state('')
	let items = $state<FollowListItem[]>([])
	let nextCursor = $state<string | null>(null)
	let activeIndex = $state(-1)
	let loading = $state(false)
	let error = $state(false)
	let open = $state(false)

	function reset() {
		search.cancel()
		items = []
		nextCursor = null
		activeIndex = -1
		loading = false
		error = false
		open = false
	}
	async function run(q: string, cursor: string | null = null) {
		loading = true
		error = false
		open = true
		try {
			const page = await fetchUserSearch(q, cursor)
			if (isStale(q, normalizeQuery(query))) return
			items = cursor ? [...items, ...page.items] : page.items
			nextCursor = page.nextCursor
			if (!cursor) activeIndex = -1
		} catch {
			if (isStale(q, normalizeQuery(query))) return
			error = true
		} finally {
			if (!isStale(q, normalizeQuery(query))) loading = false
		}
	}
	const search = debounce((q: string) => void run(q), 250)

	function onInput() {
		const q = normalizeQuery(query)
		if (q === null) return reset()
		search(q)
	}
	function clear() {
		reset()
		query = ''
	}
	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault()
			if (open) open = false
			else clear()
		} else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length > 0) {
			event.preventDefault()
			open = true
			activeIndex = moveActiveIndex(activeIndex, event.key === 'ArrowDown' ? 1 : -1, items.length)
		}
	}
	function onSubmit(event: SubmitEvent) {
		const target = items[activeIndex] ?? items[0]
		if (!target) return
		event.preventDefault()
		void goto(`/u/${target.username}`)
	}
	function onFocusOut(event: FocusEvent) {
		// Safari doesn't focus clicked links/buttons (relatedTarget is null); outside clicks are
		// handled by onPointerDown, so only close when focus moves to a known outside element.
		const next = event.relatedTarget as Node | null
		if (next && !root?.contains(next)) open = false
	}
	function onPointerDown(event: PointerEvent) {
		if (open && !root?.contains(event.target as Node)) open = false
	}

	afterNavigate(() => {
		clear()
	})
	onDestroy(() => search.cancel())
</script>

<svelte:window onpointerdown={onPointerDown} />

<div bind:this={root} class="relative" onfocusout={onFocusOut}>
	<form action="/search" method="GET" role="search" onsubmit={onSubmit}>
		<input
			name="q"
			type="search"
			required
			maxlength={SEARCH_QUERY_MAX}
			autocomplete="off"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls={listId}
			aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
			aria-label={$_('nav.search')}
			placeholder={$_('search.placeholder')}
			class="w-full rounded-lg border border-line px-3 text-body"
			bind:value={query}
			oninput={onInput}
			onkeydown={onKeydown}
		/>
	</form>
	{#if open}
		<SearchResults
			id={listId}
			{items}
			{activeIndex}
			{loading}
			{error}
			hasMore={nextCursor !== null}
			onMore={() => nextCursor && run(normalizeQuery(query) ?? '', nextCursor)}
			onHover={(i) => (activeIndex = i)}
		/>
	{/if}
</div>

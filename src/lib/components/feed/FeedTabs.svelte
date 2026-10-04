<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Tabs from '$lib/components/ui/Tabs.svelte'

	let { scope }: { scope: 'all' | 'following' } = $props()
	const tabs = $derived([
		{ href: '/', label: $_('feed.forYou'), active: scope === 'all' },
		{ href: '/?scope=following', label: $_('feed.following'), active: scope === 'following' },
	])
</script>

<Tabs
	items={tabs}
	label={$_('feed.tabs')}
	replaceState
	class="border-b border-line bg-surface max-md:border"
/>

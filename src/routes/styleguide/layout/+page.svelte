<script lang="ts">
	import { page } from '$app/state'
	import AppHeader from '$lib/components/layout/AppHeader.svelte'
	import AppShell from '$lib/components/layout/AppShell.svelte'
	import BottomNav from '$lib/components/layout/BottomNav.svelte'
	import { DEFAULT_NAV_ITEMS } from '$lib/components/layout/nav-items'

	const rows = Array.from({ length: 40 }, (_, index) =>
		index === 39 ? 'Last item' : `Item ${index + 1}`,
	)
</script>

<AppShell>
	{#snippet header()}
		<AppHeader title="Layout" onBack={() => history.back()} />
	{/snippet}

	<ul class="divide-y divide-border">
		{#each rows as row (row)}
			<li class="p-4">{row}</li>
		{/each}
	</ul>

	{#snippet nav()}
		<BottomNav items={DEFAULT_NAV_ITEMS} pathname={page.url.pathname} />
	{/snippet}
</AppShell>

<script lang="ts">
	import { _ } from 'svelte-i18n'

	let { scope }: { scope: 'all' | 'following' } = $props()
	const base = 'flex-1 border-b-2 py-4 text-center text-body no-underline'
	const tabs = $derived([
		{ href: '/', label: $_('feed.forYou'), active: scope === 'all' },
		{ href: '/?scope=following', label: $_('feed.following'), active: scope === 'following' },
	])
</script>

<nav class="flex border-b border-line bg-surface max-md:border">
	{#each tabs as tab (tab.href)}
		<a
			href={tab.href}
			aria-current={tab.active ? 'page' : undefined}
			class="{base} {tab.active
				? 'border-primary font-semibold text-fg'
				: 'border-transparent text-fg-muted'}">{tab.label}</a
		>
	{/each}
</nav>

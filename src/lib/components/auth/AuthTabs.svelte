<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import Tabs from '$lib/components/ui/Tabs.svelte'

	const items = $derived([
		{ href: '/login', label: $_('auth.signIn'), active: page.url.pathname === '/login' },
		{
			href: '/register',
			label: $_('auth.createAccount'),
			active: page.url.pathname === '/register',
		},
	])
</script>

<Tabs {items} label={$_('auth.tabsLabel')} />

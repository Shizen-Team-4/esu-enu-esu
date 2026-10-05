<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import { isActive, sidebarNavItems, withProfileHref } from '$lib/navigation/nav-items'
	import type { UserSummary } from '$lib/contract'
	import NavIcon from './NavIcon.svelte'
	import Avatar from './ui/Avatar.svelte'
	import AccountMenu from './AccountMenu.svelte'
	import UnreadBadge from './notifications/UnreadBadge.svelte'
	let {
		me,
		unreadCount = null,
		messageCount = 0,
	}: {
		me: UserSummary | null
		unreadCount?: number | null
		messageCount?: number | null
	} = $props()
	const items = $derived(withProfileHref(sidebarNavItems, me?.username))
</script>

<aside data-sidebar class="app-sidebar" aria-label={$_('nav.label')}>
	<a href="/" class="sidebar-brand" aria-label={$_('app.name')}>
		<img src="/sns-logo-monochrome.png" alt="SNS" class="sns-logo" />
	</a>
	<nav class="sidebar-links">
		{#each items as item (item.key)}
			{@const active = isActive(page.url.pathname, item.href)}
			<a
				href={item.href}
				class="sidebar-link"
				class:active
				aria-label={$_('nav.' + item.key)}
				aria-current={active ? 'page' : undefined}
				title={$_('nav.' + item.key)}
			>
				<span class="relative inline-flex shrink-0">
					{#if item.key === 'profile' && me}<Avatar
							src={me.avatarUrl}
							name={me.displayName}
							size="sm"
						/>{:else}<NavIcon path={item.path} size={26} />{/if}
					{#if item.key === 'messages' || item.key === 'notifications'}<span
							class="absolute -right-2 -top-2"
							><UnreadBadge count={item.key === 'messages' ? messageCount : unreadCount} /></span
						>{/if}
				</span>
				<span class="sidebar-label">{$_('nav.' + item.key)}</span>
			</a>
		{/each}
	</nav>
	<div class="sidebar-more"><AccountMenu {me} placement="sidebar" /></div>
</aside>

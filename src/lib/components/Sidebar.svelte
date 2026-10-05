<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import { isActive, sidebarNavItems, withProfileHref } from '$lib/navigation/nav-items'
	import type { UserSummary } from '$lib/contract'
	import Button from './ui/Button.svelte'
	import NavIcon from './NavIcon.svelte'
	import UnreadBadge from './notifications/UnreadBadge.svelte'
	let { me, unreadCount = null }: { me: UserSummary | null; unreadCount?: number | null } = $props()
	const items = $derived(withProfileHref(sidebarNavItems, me?.username))
</script>

<aside class="hidden px-gutter py-6 lg:block" aria-label={$_('nav.label')}>
	<p class="mb-2 px-3 text-meta text-fg-muted">{$_('nav.yourSpace')}</p>
	<nav class="grid gap-1">
		{#each items as item (item.key)}
			{@const active = isActive(page.url.pathname, item.href)}
			<a
				href={item.href}
				aria-current={active ? 'page' : undefined}
				class="flex min-h-11 items-center gap-3 border-l-[3px] px-3 text-body no-underline {active
					? 'border-primary bg-primary-soft text-primary'
					: 'border-transparent text-fg hover:bg-elevated'}"
			>
				<NavIcon path={item.path} size={20} />{$_(`nav.${item.key}`)}
				{#if item.key === 'notifications'}<UnreadBadge count={unreadCount} />{/if}
			</a>
		{/each}
	</nav>
	<Button variant="primary" href="/create" class="mt-6 w-full">{$_('nav.createPost')}</Button>
</aside>

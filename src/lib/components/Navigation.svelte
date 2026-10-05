<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import { isActive, mobileNavItems, withProfileHref } from '$lib/navigation/nav-items'
	import type { UserSummary } from '$lib/contract'
	import NavIcon from './NavIcon.svelte'
	import Avatar from './ui/Avatar.svelte'
	import UnreadBadge from './notifications/UnreadBadge.svelte'
	let { me, messageCount = 0 }: { me: UserSummary | null; messageCount?: number | null } = $props()
	const items = $derived(withProfileHref(mobileNavItems, me?.username))
</script>

<nav data-app-navigation aria-label={$_('nav.label')} class="mobile-navigation">
	{#each items as item (item.key)}
		<a
			href={item.href}
			aria-label={$_('nav.' + item.key)}
			aria-current={isActive(page.url.pathname, item.href) ? 'page' : undefined}
			class="relative grid min-h-14 min-w-11 place-items-center text-fg no-underline"
		>
			<span class="relative inline-flex">
				{#if item.key === 'profile' && me}<Avatar user={me} size={32} />{:else}<NavIcon
						path={item.path}
						size={26}
					/>{/if}
				{#if item.key === 'messages'}<span class="absolute -top-2 -right-2"
						><UnreadBadge count={messageCount} /></span
					>{/if}
			</span>
		</a>
	{/each}
</nav>

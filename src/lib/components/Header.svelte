<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { UserSummary } from '$lib/contract'
	import AccountMenu from './AccountMenu.svelte'
	import NavIcon from './NavIcon.svelte'
	import { sidebarNavItems } from '$lib/navigation/nav-items'
	let { me }: { me: UserSummary | null } = $props()
</script>

<header class="mobile-header">
	<a href="/" class="text-2xl font-semibold tracking-tight text-fg no-underline"
		><img src="/sns-logo-monochrome.png" alt="SNS" class="sns-logo" /></a
	>
	<div class="flex items-center gap-2">
		{#each sidebarNavItems.filter( (item) => ['search', 'notifications'].includes(item.key) ) as item}<a
				href={item.href}
				aria-label={$_('nav.' + item.key)}
				class="grid size-11 place-items-center text-fg"><NavIcon path={item.path} /></a
			>{/each}
		<AccountMenu {me} />
	</div>
</header>

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { UserSummary } from '$lib/contract'
	import { mobileNavItems } from '$lib/navigation/nav-items'
	import AvatarMenu from './AvatarMenu.svelte'
	import HeaderSearch from './search/HeaderSearch.svelte'
	import NavIcon from './NavIcon.svelte'
	import IconButton from './ui/IconButton.svelte'
	let { me }: { me: UserSummary | null } = $props()
	const bell = mobileNavItems.find((item) => item.key === 'notifications')
</script>

<header
	class="sticky top-0 z-10 grid min-h-app-header grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line bg-surface px-gutter"
>
	<a href="/" class="flex min-h-11 items-center text-title font-semibold text-fg no-underline"
		>{$_('app.name')}</a
	>
	<div class="mx-auto hidden w-full max-w-md lg:block"><HeaderSearch /></div>
	<div class="col-start-3 flex items-center gap-1">
		{#if bell}
			<span class="hidden lg:block"
				><IconButton label={$_('nav.notifications')} href={bell.href}
					><NavIcon path={bell.path} /></IconButton
				></span
			>
		{/if}
		<AvatarMenu {me} />
	</div>
</header>

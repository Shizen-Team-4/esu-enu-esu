<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import { isActive, mobileNavItems } from '$lib/navigation/nav-items'
	import NavIcon from './NavIcon.svelte'
</script>

<nav
	aria-label={$_('nav.label')}
	class="fixed inset-x-0 bottom-0 z-20 flex items-end justify-around border-t border-line bg-surface px-1 pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-auto md:w-rail md:flex-col md:items-center md:justify-start md:gap-2 md:border-t-0 md:border-r md:py-3 lg:hidden"
>
	{#each mobileNavItems as item (item.key)}
		{@const active = isActive(page.url.pathname, item.href)}
		{@const isCreate = item.key === 'create'}
		<a
			href={item.href}
			aria-current={active ? 'page' : undefined}
			class="relative flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-1 overflow-hidden px-0.5 text-nav no-underline md:size-11 md:min-h-11 md:flex-none {active &&
			!isCreate
				? 'text-primary'
				: 'text-fg-muted'}"
		>
			{#if active && !isCreate}<span
					class="absolute top-0 h-0.5 w-5 bg-primary md:top-auto md:left-0 md:h-5 md:w-0.5"
					aria-hidden="true"
				></span>{/if}
			{#if isCreate}
				<span
					class="grid size-11 place-items-center rounded-lg bg-primary text-on-primary md:size-11"
					><NavIcon path={item.path} /></span
				>
			{:else}
				<NavIcon path={item.path} />
			{/if}
			<span class={isCreate ? 'sr-only' : 'max-w-full truncate md:sr-only'}
				>{$_(`nav.${item.key}`)}</span
			>
		</a>
	{/each}
</nav>

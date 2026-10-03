<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	const items = [
		{ key: 'home', href: '/', path: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z' },
		{
			key: 'reels',
			href: '/reels',
			path: 'M4 3h16v18H4z M4 8h16 M9 3l3 5 M15 3l3 5 M10 12l5 3-5 3z',
		},
		{ key: 'create', href: '/create', path: 'M12 4v16 M4 12h16' },
		{ key: 'search', href: '/search', path: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0' },
		{
			key: 'profile',
			href: '/profile',
			path: 'M20 21a8 8 0 0 0-16 0 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
		},
	]
</script>

<nav
	aria-label={$_('nav.label')}
	class="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-auto md:w-[72px] md:flex-col md:justify-start md:border-r md:border-t-0 md:p-3 xl:w-[240px]"
>
	<a href="/" class="hidden min-h-14 items-center text-xl font-semibold text-fg md:flex xl:mb-5"
		><span class="xl:hidden">S</span><span class="hidden xl:inline">SNS</span></a
	>
	{#each items as item}
		<a
			href={item.href}
			aria-label={$_(`nav.${item.key}`)}
			aria-current={page.url.pathname === item.href ? 'page' : undefined}
			class="flex min-h-12 min-w-11 items-center justify-center gap-4 rounded-xl p-3 text-fg hover:bg-elevated md:mb-2 xl:justify-start {item.key ===
			'create'
				? 'bg-primary text-on-primary'
				: ''}"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"><path d={item.path} /></svg
			>
			<span class="hidden xl:inline">{$_(`nav.${item.key}`)}</span>
		</a>
	{/each}
</nav>

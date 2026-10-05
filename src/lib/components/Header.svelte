<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { UserSummary } from '$lib/contract'
	import AccountMenu from './AccountMenu.svelte'
	import HeaderSearch from './search/HeaderSearch.svelte'
	let { me }: { me: UserSummary | null } = $props()
</script>

<header
	class="sticky top-0 z-10 grid min-h-app-header grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line bg-surface px-gutter"
>
	<a href="/" class="flex min-h-11 items-center text-title font-semibold text-fg no-underline"
		>{$_('app.name')}</a
	>
	<div class="mx-auto hidden w-full max-w-md lg:block"><HeaderSearch /></div>
	<div class="col-start-3 flex items-center gap-1">
		<AccountMenu {me} />
	</div>
</header>

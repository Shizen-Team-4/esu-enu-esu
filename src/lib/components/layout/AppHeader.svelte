<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left'
	import type { Snippet } from 'svelte'
	import { _ } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'

	let {
		title,
		onBack,
		actions,
	}: {
		title: string
		/** When given, a back button is shown. */
		onBack?: () => void
		actions?: Snippet
	} = $props()
</script>

<header
	class="sticky top-0 z-10 border-b border-border bg-background pt-[env(safe-area-inset-top)]"
>
	<div class="flex h-(--header-height) items-center gap-2 px-2">
		{#if onBack}
			<IconButton icon={ArrowLeft} label={$_('common.back')} onclick={() => onBack()} />
		{/if}
		<h1 class="min-w-0 flex-1 truncate px-2 text-lg font-semibold">{title}</h1>
		{#if actions}
			<div class="flex items-center gap-1">{@render actions()}</div>
		{/if}
	</div>
</header>

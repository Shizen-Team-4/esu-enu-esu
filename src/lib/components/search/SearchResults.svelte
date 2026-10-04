<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { FollowListItem } from '$lib/contract'
	import Avatar from '../ui/Avatar.svelte'

	let {
		id,
		items,
		activeIndex,
		loading,
		error,
		hasMore,
		onMore,
		onHover,
	}: {
		id: string
		items: FollowListItem[]
		activeIndex: number
		loading: boolean
		error: boolean
		hasMore: boolean
		onMore: () => void
		onHover?: (index: number) => void
	} = $props()
</script>

<div
	class="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-lg border border-line bg-surface"
>
	<ul role="listbox" {id} aria-label={$_('search.results')}>
		{#each items as item, i (item.id)}
			<li
				role="option"
				id="{id}-{i}"
				aria-selected={i === activeIndex}
				class={i === activeIndex ? 'bg-primary-soft' : ''}
				onmouseenter={() => onHover?.(i)}
			>
				<a
					href="/u/{item.username}"
					class="flex min-h-11 items-center gap-3 px-3 no-underline hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
				>
					<Avatar src={item.avatarUrl} name={item.displayName} size="sm" />
					<span class="text-body text-fg">{item.displayName}</span>
					<span class="text-meta text-fg-muted">@{item.username}</span>
				</a>
			</li>
		{/each}
	</ul>
	<div aria-live="polite">
		{#if loading}
			<p class="m-0 px-3 py-2 text-meta text-fg-muted">{$_('search.loading')}</p>
		{:else if error}
			<p class="m-0 px-3 py-2 text-meta text-fg-muted">{$_('search.error')}</p>
		{:else if items.length === 0}
			<p class="m-0 px-3 py-2 text-meta text-fg-muted">{$_('search.noResults')}</p>
		{/if}
	</div>
	{#if hasMore}
		<button
			type="button"
			class="min-h-11 w-full cursor-pointer border-0 border-t border-line bg-transparent px-3 text-body text-primary hover:bg-elevated"
			onclick={onMore}>{$_('search.more')}</button
		>
	{/if}
</div>

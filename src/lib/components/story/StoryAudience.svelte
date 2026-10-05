<script lang="ts">
	import { onMount } from 'svelte'
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import type { UserSummary } from '$lib/contract'
	let { storyId, onclose }: { storyId: string; onclose: () => void } = $props()
	let users = $state<{ user: UserSummary; viewedAt: string; liked: boolean }[]>([])
	let total = $state(0)
	let nextCursor = $state<string | null>(null)
	let loading = $state(false)
	let failed = $state(false)
	async function load(cursor?: string) {
		if (loading) return
		loading = true
		failed = false
		try {
			const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
			const response = await fetch(`/api/stories/${encodeURIComponent(storyId)}/viewers${query}`)
			if (!response.ok) throw new Error('VIEWERS')
			const result: { items: typeof users; total: number; nextCursor: string | null } =
				await response.json()
			users = cursor ? [...users, ...result.items] : result.items
			total = result.total
			nextCursor = result.nextCursor
		} catch {
			failed = true
		} finally {
			loading = false
		}
	}
	onMount(() => {
		void load()
	})
</script>

<div class="story-audience" role="dialog" aria-modal="true" aria-label={$_('story.views')}>
	<div class="story-audience-header">
		<strong>{$_('story.views')} · {total}</strong><button
			type="button"
			onclick={onclose}
			aria-label={$_('story.close')}>×</button
		>
	</div>
	{#if failed}<p role="alert">
			{$_('story.viewError')}
			<button type="button" onclick={() => load()}>{$_('common.retry')}</button>
		</p>{/if}
	{#if !loading && !failed && users.length === 0}<p class="p-5 text-sm text-fg-muted">
			{$_('story.noViews')}
		</p>{/if}
	<ul class="story-audience-list">
		{#each users as viewer (viewer.user.id)}
			<li>
				<Avatar src={viewer.user.avatarUrl} name={viewer.user.displayName} /><span
					class="min-w-0 flex-1 truncate"
					>{viewer.user.displayName}<small class="block text-fg-muted"
						>@{viewer.user.username}</small
					></span
				>{#if viewer.liked}<span aria-label={$_('story.love')}>♥</span>{/if}
			</li>
		{/each}
	</ul>
	{#if nextCursor}<button
			class="story-audience-more"
			type="button"
			disabled={loading}
			onclick={() => load(nextCursor ?? undefined)}>{$_('feed.more')}</button
		>{/if}
</div>

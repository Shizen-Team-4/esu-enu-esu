<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import ErrorState from '$lib/components/ui/ErrorState.svelte'
	import PostCard from '$lib/components/post/PostCard.svelte'
	import type { Page, Post } from '$lib/contract'
	import { createFeedPager, type FeedPager } from '$lib/feed/feed-pager'
	import { fetchFeed } from '$lib/feed/fetch-feed'

	let { initial, scope }: { initial: Page<Post>; scope: 'all' | 'following' } = $props()

	const view = (pager: FeedPager) => ({
		items: pager.items,
		nextCursor: pager.nextCursor,
		status: pager.status,
		errorCode: pager.error ? ((pager.error as { code?: string }).code ?? 'INTERNAL') : null,
	})
	// svelte-ignore state_referenced_locally
	const pager: FeedPager = createFeedPager(
		initial,
		(cursor) => fetchFeed({ scope, cursor }),
		() => (snap = view(pager)),
	)
	// svelte-ignore state_referenced_locally
	let snap = $state(view(pager))

	$effect(() => {
		pager.reset(initial)
	})
</script>

{#if snap.items.length === 0 && snap.nextCursor === null}
	<EmptyState title={scope === 'following' ? $_('feed.emptyFollowing') : $_('feed.emptyAll')}>
		{#snippet action()}
			<Button href={scope === 'following' ? '/search' : '/create'} variant="primary"
				>{scope === 'following' ? $_('nav.search') : $_('nav.create')}</Button
			>
		{/snippet}
	</EmptyState>
{:else}
	<div class="feed-posts">
		{#each snap.items as post (post.id)}
			<PostCard {post} loggedIn />
		{/each}
	</div>
	{#if snap.status === 'error'}
		<ErrorState
			code={snap.errorCode as import('$lib/types/error').ErrorCode}
			onRetry={() => pager.retry()}
		/>
	{:else if snap.nextCursor !== null}
		<div class="grid justify-items-center py-6">
			<Button disabled={snap.status === 'loading'} onclick={() => pager.loadMore()}
				>{$_('feed.more')}</Button
			>
		</div>
	{/if}
{/if}

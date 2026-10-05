<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { FollowListItem, Page } from '$lib/contract'
	import { fetchFollows, type FollowListKind } from '$lib/follows/fetch-follows'
	import { createPager, type Pager } from '$lib/pagination/create-pager'
	import { observeMore } from '$lib/pagination/observe-more'
	import EmptyState from '../ui/EmptyState.svelte'
	import ErrorState from '../ui/ErrorState.svelte'
	import FollowListRow from './FollowListRow.svelte'

	let {
		initial,
		username,
		kind,
	}: {
		initial: Page<FollowListItem>
		username: string
		kind: FollowListKind
	} = $props()
	const view = (pager: Pager<FollowListItem>) => ({
		items: pager.items,
		nextCursor: pager.nextCursor,
		status: pager.status,
		errorCode: (pager.error as { code?: string } | null)?.code ?? 'INTERNAL',
	})
	// svelte-ignore state_referenced_locally
	const pager = createPager(
		initial,
		(cursor) => fetchFollows(username, kind, cursor),
		() => {
			snap = view(pager)
		},
	)
	// Keep existing user identities stable so pagination does not reset row-local follow changes.
	// svelte-ignore state_referenced_locally
	let snap = $state.raw(view(pager))
	$effect(() => {
		pager.reset(initial)
	})
</script>

{#if snap.items.length === 0 && snap.nextCursor === null}
	<EmptyState title={$_(`follows.empty${kind === 'followers' ? 'Followers' : 'Following'}`)} />
{:else}
	<ul
		class="m-0 list-none divide-y divide-line border-y border-line bg-surface p-0"
		aria-busy={snap.status === 'loading'}
	>
		{#each snap.items as user (user.id)}<FollowListRow {user} />{/each}
	</ul>
{/if}
{#if snap.status === 'error'}
	<ErrorState
		code={snap.errorCode as import('$lib/types/error').ErrorCode}
		onRetry={() => pager.retry()}
	/>
{:else if snap.status === 'loading'}
	<p role="status" class="py-4 text-center text-meta text-fg-muted">{$_('follows.loading')}</p>
{:else if snap.nextCursor !== null}
	<div
		class="h-11"
		use:observeMore={() => {
			void pager.loadMore()
		}}
	></div>
{/if}

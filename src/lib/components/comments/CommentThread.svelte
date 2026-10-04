<script lang="ts">
	import type { Snippet } from 'svelte'
	import { _ } from 'svelte-i18n'
	import type { Comment } from '$lib/contract'
	import type { CommentPage } from '$lib/comments/comment-state'
	import CommentBranch from './CommentBranch.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'

	let {
		focused = $bindable(null),
		roots,
		replies,
		expanded,
		onExpand,
		onload,
		onReply,
		onDeleted,
		replyComposer,
		onNavigate,
	}: {
		focused?: Comment | null
		roots: CommentPage
		replies: Record<string, CommentPage>
		expanded: Set<string>
		onExpand: (id: string) => void
		onload: (parentId: string | null) => void
		onReply: (comment: Comment) => void
		onDeleted: (comment: Comment) => void
		replyComposer: Snippet<[Comment]>
		onNavigate: () => void
	} = $props()
	const visibleRoots = $derived(
		focused ? roots.items.filter((root) => root.id === focused?.parentId) : roots.items,
	)
	$effect(() => {
		if (
			focused &&
			!replies[focused.parentId ?? '']?.items.some((reply) => reply.id === focused?.id)
		)
			focused = null
	})
</script>

{#if focused}<Button
		class="mt-4"
		variant="ghost"
		onclick={() => {
			onNavigate()
			focused = null
		}}>{$_('comments.backToMainThread')}</Button
	>{/if}
{#if roots.items.length === 0}<EmptyState
		title={$_('comments.empty')}
		description={$_('comments.emptyHint')}
	/>{/if}
<div class="divide-y divide-line" aria-busy={roots.status === 'loading'}>
	{#each visibleRoots as root (root.id)}
		<CommentBranch
			{root}
			page={replies[root.id]}
			focusedId={focused?.id ?? null}
			expanded={expanded.has(root.id)}
			ontoggle={() => onExpand(root.id)}
			onload={() => onload(root.id)}
			{onReply}
			onExpandBranch={(comment) => {
				onNavigate()
				focused = comment
			}}
			{onDeleted}
			{replyComposer}
		/>
	{/each}
</div>
{#if !focused}
	{#if roots.status === 'error'}
		<p role="alert" class="text-body">
			{$_(errorMessageKey((roots.error as { code?: string })?.code))}
		</p>
		<Button onclick={() => onload(null)}>{$_('error.retry')}</Button>
	{:else if roots.nextCursor}<div class="py-4">
			<Button disabled={roots.status === 'loading'} onclick={() => onload(null)}
				>{$_(roots.status === 'loading' ? 'comments.loading' : 'comments.more')}</Button
			>
		</div>{/if}
{/if}

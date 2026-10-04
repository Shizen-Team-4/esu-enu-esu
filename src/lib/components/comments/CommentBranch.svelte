<script lang="ts">
	import type { Snippet } from 'svelte'
	import { _ } from 'svelte-i18n'
	import type { Comment } from '$lib/contract'
	import type { CommentPage } from '$lib/comments/comment-state'
	import { branchReplies, focusBranch } from '$lib/comments/comment-thread'
	import { errorMessageKey } from '$lib/errors/error-message'
	import CommentItem from './CommentItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	let {
		root,
		page,
		focusedId,
		expanded,
		ontoggle,
		onload,
		onReply,
		onExpandBranch,
		onDeleted,
		replyComposer,
	}: {
		root: Comment
		page?: CommentPage
		focusedId: string | null
		expanded: boolean
		ontoggle: () => void
		onload: () => void
		onReply: (comment: Comment) => void
		onExpandBranch: (comment: Comment) => void
		onDeleted: (comment: Comment) => void
		replyComposer: Snippet<[Comment]>
	} = $props()
	const branch = $derived(focusBranch(root, page?.items ?? [], focusedId))
	const replyCount = $derived(focusedId ? branch.replies.length : root.replyCount)
</script>

<div class="py-4">
	{#if branch.ancestors.length}
		<div aria-label={$_('comments.context')}>
			{#each branch.ancestors as comment (comment.id)}
				<div class="ancestor relative pb-4">
					<CommentItem {comment} context {onReply} {onDeleted} {replyComposer} />
				</div>
			{/each}
		</div>
	{/if}
	<div class="branch-parent relative" class:connected={expanded && branch.replies.length > 0}>
		<CommentItem comment={branch.parent} {onReply} {onDeleted} {replyComposer} />
		{#if replyCount > 0 || expanded}
			<button
				type="button"
				class="ml-12 min-h-11 px-2 text-meta text-fg-muted"
				aria-expanded={expanded}
				aria-controls="replies-{root.id}"
				onclick={ontoggle}
			>
				{expanded
					? $_('comments.hideReplies')
					: $_('comments.replyCount', { values: { count: replyCount } })}
			</button>
		{/if}
	</div>
	{#if expanded}
		<div id="replies-{root.id}" class="branch-replies" aria-busy={page?.status === 'loading'}>
			{#each branch.replies as comment (comment.id)}
				<div class="reply-row relative py-3">
					<CommentItem
						{comment}
						branchCount={branchReplies(root, page?.items ?? [], comment.id).length}
						{onReply}
						{onExpandBranch}
						{onDeleted}
						{replyComposer}
					/>
				</div>
			{/each}
			{#if page?.status === 'error'}
				<p role="alert" class="text-body">
					{$_(errorMessageKey((page.error as { code?: string })?.code))}
				</p>
				<Button onclick={onload}>{$_('error.retry')}</Button>
			{:else if page?.status === 'loading'}<p role="status" class="py-3 text-meta text-fg-muted">
					{$_('comments.loading')}
				</p>
			{:else if page?.nextCursor}<Button variant="ghost" onclick={onload}
					>{$_('comments.moreReplies')}</Button
				>{/if}
		</div>
	{/if}
</div>

<style>
	.ancestor::before,
	.branch-parent.connected::before,
	.reply-row::before {
		content: '';
		position: absolute;
		left: var(--spacing-comment-axis);
		top: calc(var(--spacing-comment-avatar) + var(--spacing-comment-connector-gap));
		bottom: 0;
		border-left: var(--comment-connector-width) solid var(--comment-connector-color);
	}
	.ancestor::before {
		bottom: var(--spacing-comment-connector-gap);
		border-left-style: dashed;
	}
	.branch-replies {
		margin-left: var(--spacing-comment-indent);
	}
	.reply-row::before {
		left: calc(var(--spacing-comment-axis) - var(--spacing-comment-indent));
		top: 0;
	}
	.reply-row:last-of-type::before {
		bottom: auto;
		height: calc(var(--spacing-comment-axis) + var(--spacing) * 3);
	}
	.reply-row::after {
		content: '';
		position: absolute;
		left: calc(var(--spacing-comment-axis) - var(--spacing-comment-indent));
		top: calc(var(--spacing-comment-axis) + var(--spacing) * 3);
		width: calc(
			var(--spacing-comment-indent) - var(--spacing-comment-axis) -
				var(--spacing-comment-connector-gap)
		);
		border-top: var(--comment-connector-width) solid var(--comment-connector-color);
	}
</style>

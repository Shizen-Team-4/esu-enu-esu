<script lang="ts">
	import { untrack } from 'svelte'
	import { _ } from 'svelte-i18n'
	import type { Comment, ErrorEnvelope, Page, UserSummary } from '$lib/contract'
	import { createCommentState } from '$lib/comments/comment-state'
	import { fetchComments } from '$lib/comments/fetch-comments'
	import { cancelReplyTarget, selectReplyTarget } from '$lib/comments/composer-state'
	import CommentThread from './CommentThread.svelte'
	import ReplyComposer from './ReplyComposer.svelte'

	let {
		postId,
		initial,
		me,
		form,
		onCountChange,
	}: {
		postId: string
		initial: Page<Comment>
		me: UserSummary | null
		form: { error?: ErrorEnvelope['error']; body?: string; parentId?: string } | null
		onCountChange: (delta: number) => void
	} = $props()
	const controller = untrack(() =>
		createCommentState(
			initial,
			(parentId, cursor) => fetchComments(postId, parentId, cursor),
			() => (snap = controller.snapshot()),
		),
	)
	let snap = $state(untrack(() => controller.snapshot()))
	let target = $state<Comment | null>(null)
	let focused = $state<Comment | null>(null)
	let body = $state(untrack(() => form?.body ?? ''))
	let fallbackParentId = $state(untrack(() => form?.parentId ?? ''))
	let pending = $state(false)
	let initialError = $state(untrack(() => form?.error))
	let notice = $state<string | null>(null)
	let expanded = $state(new Set<string>())

	function reply(comment: Comment) {
		;({ target, fallbackParentId } = selectReplyTarget(
			{ target, fallbackParentId, pending },
			comment,
		))
	}
	function cancel() {
		;({ target, fallbackParentId } = cancelReplyTarget({ target, fallbackParentId, pending }))
	}
	function toggle(id: string) {
		const next = new Set(expanded)
		if (next.has(id)) {
			next.delete(id)
			if (!pending && target?.parentId === id) target = null
		} else {
			next.add(id)
			void controller.loadMore(id)
		}
		expanded = next
	}
	function created(comment: Comment) {
		initialError = undefined
		controller.add(comment)
		if (comment.parentId === null) focused = null
		if (comment.parentId && !expanded.has(comment.parentId)) toggle(comment.parentId)
		target = null
		body = ''
		fallbackParentId = ''
		onCountChange(1)
		notice = 'comments.posted'
	}
	function deleted(comment: Comment) {
		controller.remove(comment)
		const clearsTarget =
			target?.id === comment.id || (comment.parentId === null && target?.parentId === comment.id)
		if (!pending && clearsTarget) target = null
		onCountChange(-1)
		if (comment.parentId === null) void controller.loadMore()
		notice = 'comments.deleted'
	}
</script>

<section
	id="comments"
	aria-labelledby="comments-heading"
	class="comment-section flex-1 bg-surface px-gutter pt-5"
>
	<h2 id="comments-heading" class="text-body font-semibold">{$_('post.comments')}</h2>
	{#if !target}<div
			class="mt-4 rounded-comment border border-line bg-background px-4"
			data-root-composer
		>
			{@render composer()}
		</div>{/if}
	<CommentThread
		bind:focused
		roots={snap.roots}
		replies={snap.replies}
		{expanded}
		onExpand={toggle}
		onload={(id) => controller.loadMore(id)}
		onReply={reply}
		replyDisabled={pending}
		onDeleted={deleted}
		{replyComposer}
		onNavigate={() => {
			if (!pending) target = null
		}}
	/>
</section>

{#snippet composer()}
	<ReplyComposer
		{me}
		{target}
		bind:body
		{fallbackParentId}
		bind:pending
		{initialError}
		{notice}
		oncancel={cancel}
		onCreated={created}
	/>
{/snippet}

{#snippet replyComposer(comment: Comment)}
	{#if target?.id === comment.id}{@render composer()}{/if}
{/snippet}

<style>
	.comment-section {
		padding-bottom: calc(
			var(--spacing-bottom-nav) + env(safe-area-inset-bottom) + var(--spacing-inset)
		);
	}
	@media (min-width: 768px) {
		.comment-section {
			padding-bottom: var(--spacing-inset);
		}
	}
</style>

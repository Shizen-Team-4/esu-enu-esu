<script lang="ts">
	import type { Snippet } from 'svelte'
	import { _, locale } from 'svelte-i18n'
	import type { Comment } from '$lib/contract'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import { relativeTime } from '$lib/format/relative-time'
	import DeleteComment from './DeleteComment.svelte'

	let {
		comment,
		context = false,
		branchCount = 0,
		onReply,
		onExpandBranch,
		onDeleted,
		replyComposer,
	}: {
		comment: Comment
		context?: boolean
		branchCount?: number
		onReply: (comment: Comment) => void
		onExpandBranch?: (comment: Comment) => void
		onDeleted: (comment: Comment) => void
		replyComposer: Snippet<[Comment]>
	} = $props()
	const href = $derived(`/u/${encodeURIComponent(comment.author.username)}`)
</script>

<article class="comment-item relative min-w-0" data-comment-id={comment.id}>
	<header class="flex items-start gap-3">
		<Avatar src={comment.author.avatarUrl} name={comment.author.displayName} />
		<div class="min-w-0 flex-1">
			<a {href} class="block truncate text-body font-semibold text-fg no-underline"
				>{comment.author.displayName}</a
			>
			<p class="text-meta text-fg-muted wrap-anywhere">
				@{comment.author.username} ·
				<time datetime={comment.createdAt}
					>{relativeTime(comment.createdAt, new Date(), $locale ?? 'en')}</time
				>
			</p>
		</div>
	</header>
	<div class="mt-2 ml-12 rounded-comment border border-line bg-background px-4 pt-3">
		<p class="text-body wrap-anywhere whitespace-pre-wrap">
			{#if comment.replyToUser}<a
					href="/u/{encodeURIComponent(comment.replyToUser.username)}"
					class="text-link">@{comment.replyToUser.username}</a
				>{' '}{/if}{comment.body}
		</p>
		{#if !context}
			<div class="flex flex-wrap items-center justify-end gap-1">
				<button
					type="button"
					class="min-h-11 cursor-pointer px-2 text-meta text-fg-muted"
					onclick={() => onReply(comment)}>{$_('comments.reply')}</button
				>
				{#if comment.viewer.canDelete}<DeleteComment {comment} {onDeleted} />{/if}
			</div>
			{@render replyComposer(comment)}
		{:else}<div class="h-3"></div>{/if}
	</div>
	{#if !context && branchCount > 0 && onExpandBranch}
		<button
			type="button"
			class="ml-12 min-h-11 px-2 text-meta text-fg-muted"
			onclick={() => onExpandBranch?.(comment)}
			aria-expanded="false"
		>
			{$_('comments.replyCount', { values: { count: branchCount } })}
		</button>
	{/if}
</article>

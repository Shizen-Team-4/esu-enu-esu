<script lang="ts">
	import type { Comment, ErrorEnvelope, Page, Post, UserSummary } from '$lib/contract'
	import PostCard from '$lib/components/post/PostCard.svelte'
	import PageBar from '$lib/components/ui/PageBar.svelte'
	import CommentSection from './CommentSection.svelte'

	let {
		post,
		comments,
		me,
		form,
	}: {
		post: Post
		comments: Page<Comment>
		me: UserSummary | null
		form: { error?: ErrorEnvelope['error']; body?: string; parentId?: string } | null
	} = $props()
	let delta = $state(0)
	const current = $derived({
		...post,
		counts: { ...post.counts, comments: Math.max(0, post.counts.comments + delta) },
	})
</script>

<div class="post-comments">
	<PageBar />
	<PostCard post={current} />
	<CommentSection
		postId={post.id}
		initial={comments}
		{me}
		{form}
		onCountChange={(change) => (delta += change)}
	/>
</div>

<style>
	.post-comments {
		display: flex;
		flex-direction: column;
		min-height: calc(100dvh - var(--spacing-app-header));
	}
</style>

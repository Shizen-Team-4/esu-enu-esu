<script lang="ts">
	import type { Post } from '$lib/contract'
	import MediaCarousel from './MediaCarousel.svelte'
	import PostActions from './PostActions.svelte'
	import PostHeader from './PostHeader.svelte'
	let { post }: { post: Post } = $props()
</script>

<article class="feed-post">
	<PostHeader {post} />
	{#if post.media.length}<MediaCarousel media={post.media} />{/if}
	<PostActions {post} />
	{#if post.caption}<p class="post-caption">
			<a href="/u/{post.author.username}" class="font-semibold text-fg no-underline"
				>{post.author.username}</a
			>
			{post.caption}
		</p>{/if}
</article>

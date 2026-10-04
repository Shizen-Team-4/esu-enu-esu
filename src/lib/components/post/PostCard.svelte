<script lang="ts">
	import type { Post } from '$lib/contract'
	import MediaCarousel from './MediaCarousel.svelte'
	import PostActions from './PostActions.svelte'
	import PostHeader from './PostHeader.svelte'

	let { post }: { post: Post } = $props()
</script>

<article class="min-w-0 border-b border-line bg-surface max-md:border">
	<PostHeader {post} />
	{#if post.caption}
		<p class="px-gutter py-3 text-body wrap-anywhere whitespace-pre-wrap">{post.caption}</p>
	{/if}
	{#if post.media.length}
		<div class:mt-3={!post.caption}>
			<MediaCarousel media={post.media} />
		</div>
	{/if}
	<PostActions {post} />
</article>

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import { playVisible } from '$lib/media/play-visible'
	import PostActions from '$lib/components/post/PostActions.svelte'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	let { post, loggedIn = false }: { post: Post; loggedIn?: boolean } = $props()
	const media = $derived(post.media[0])
</script>

<article class="reel-card" aria-label="{$_('profile.reel')}: {post.author.username}">
	<div class="reel-video">
		{#if media?.type === 'video'}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				use:playVisible
				src={media.url}
				poster={media.thumbnailUrl ?? undefined}
				loop
				muted
				playsinline
				controls
				preload="metadata"
			></video>
		{/if}
		<div class="reel-caption">
			<a
				href="/u/{post.author.username}"
				class="flex items-center gap-3 font-semibold text-inherit no-underline"
				><Avatar user={post.author} /><span>{post.author.username}</span></a
			>
			{#if post.caption}<p class="mt-3 line-clamp-3 text-sm">{post.caption}</p>{/if}
			<a href="/p/{post.id}" class="mt-2 inline-block text-xs text-inherit">{$_('post.comments')}</a
			>
		</div>
	</div>
	<div class="reel-actions">
		<PostActions
			counts={post.counts}
			viewer={post.viewer}
			postId={post.id}
			shareUrl={post.shareUrl}
			{loggedIn}
		/>
	</div>
</article>

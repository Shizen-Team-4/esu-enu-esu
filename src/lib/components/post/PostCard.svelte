<script lang="ts">
	import { _, locale } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import { REEL_RATIO, frameRatio } from '$lib/posts/aspect-ratio'
	import { isLongCaption } from '$lib/posts/caption'
	import { formatRelativeTime } from '$lib/posts/format-relative-time'
	import { postLayout } from '$lib/posts/post-layout'
	import type { PostMenuAction } from '$lib/posts/post-menu'
	import type { Post } from '$lib/types/post'
	import MediaGallery from './MediaGallery.svelte'
	import MediaItem from './MediaItem.svelte'
	import PostActions from './PostActions.svelte'
	import PostMenu from './PostMenu.svelte'

	let {
		post,
		now = new Date(),
		onLike,
		onComment,
		onShare,
		onSave,
		onMenuAction,
	}: {
		post: Post
		/** Reference time for "3 hours ago"; pass a fixed date for deterministic output. */
		now?: Date
		onLike?: () => void
		onComment?: () => void
		onShare?: () => void
		onSave?: () => void
		onMenuAction?: (action: PostMenuAction) => void
	} = $props()

	let expanded = $state(false)

	const layout = $derived(postLayout(post))
	const lang = $derived($locale ?? 'en')
	const alt = $derived(post.caption || post.author.displayName)
	const long = $derived(isLongCaption(post.caption))
</script>

<article class="flex flex-col gap-3 py-3" data-layout={layout}>
	<header class="flex items-center gap-3 px-4">
		<Avatar user={post.author} />
		<div class="flex min-w-0 flex-1 flex-col">
			<span class="truncate text-sm font-medium">{post.author.displayName}</span>
			<span class="text-xs text-muted-foreground">
				<time datetime={post.createdAt}>{formatRelativeTime(post.createdAt, now, lang)}</time>
				{#if post.editedAt}
					<span>· {$_('post.edited')}</span>
				{/if}
			</span>
		</div>
		<PostMenu {post} onAction={onMenuAction} />
	</header>

	{#if layout === 'single'}
		<div class="bg-muted" style:aspect-ratio={frameRatio(post.media[0])}>
			<MediaItem media={post.media[0]} {alt} />
		</div>
	{:else if layout === 'gallery'}
		<MediaGallery media={post.media} {alt} />
	{:else if layout === 'reel'}
		<div class="mx-auto w-full max-w-sm bg-black" style:aspect-ratio={REEL_RATIO}>
			<MediaItem media={post.media[0]} {alt} />
		</div>
	{/if}

	<div class="px-4">
		<PostActions
			counts={post.counts}
			viewer={post.viewer}
			{onLike}
			{onComment}
			{onShare}
			{onSave}
		/>
	</div>

	{#if post.caption}
		<div class="flex flex-col items-start px-4 text-sm">
			<p class="break-words whitespace-pre-wrap {long && !expanded ? 'line-clamp-3' : ''}">
				{post.caption}
			</p>
			{#if long}
				<button
					type="button"
					class="text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
					aria-expanded={expanded}
					onclick={() => (expanded = !expanded)}
				>
					{expanded ? $_('common.less') : $_('common.more')}
				</button>
			{/if}
		</div>
	{/if}
</article>

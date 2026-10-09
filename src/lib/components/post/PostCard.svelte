<script lang="ts">
	import { _, locale } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import Button from '$lib/components/ui/Button.svelte'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import { REEL_RATIO, frameRatio } from '$lib/posts/aspect-ratio'
	import { isLongCaption } from '$lib/posts/caption'
	import { formatRelativeTime } from '$lib/posts/format-relative-time'
	import { postLayout } from '$lib/posts/post-layout'
	import type { PostMenuAction } from '$lib/posts/post-menu'
	import type { Post } from '$lib/types/post'
	import MediaGallery from './MediaGallery.svelte'
	import MediaItem from './MediaItem.svelte'
	import PostActions from './PostActions.svelte'
	import PostActivity from './PostActivity.svelte'
	import PostMenu from './PostMenu.svelte'
	import SharePostDialog from './SharePostDialog.svelte'

	let {
		post,
		editing = false,
		loggedIn,
		now = new Date(),
		onLike,
		onComment,
		onShare,
		onSave,
		onMenuAction,
	}: {
		post: Post
		editing?: boolean
		loggedIn?: boolean
		/** Reference time for "3 hours ago"; pass a fixed date for deterministic output. */
		now?: Date
		onLike?: () => void
		onComment?: () => void
		onShare?: () => void
		onSave?: () => void
		onMenuAction?: (action: PostMenuAction) => void
	} = $props()

	let expanded = $state(false)
	let deleteDialogOpen = $state(false)
	let shareDialogOpen = $state(false)

	const layout = $derived(postLayout(post))
	const lang = $derived($locale ?? 'en')
	const alt = $derived(post.caption || post.author.displayName)
	const long = $derived(isLongCaption(post.caption))

	function menuAction(action: PostMenuAction) {
		if (onMenuAction) {
			onMenuAction(action)
			return
		}
		if (action === 'edit') void goto(`/p/${post.id}?edit=1`)
		if (action === 'delete') deleteDialogOpen = true
	}
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
		<PostMenu {post} onAction={menuAction} />
	</header>
	{#if editing}
		<form id="post-edit-form" method="POST" action="?/edit" class="px-4">
			<textarea
				name="caption"
				aria-label={$_('post.caption')}
				value={post.caption}
				class="field-sizing-content min-h-6 w-full resize-none border-0 bg-transparent p-0 text-sm outline-none"
			></textarea>
		</form>
	{:else if post.caption}
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

	{#if post.repostOfId}
		{#if post.original}
			<div class="mx-4 rounded-lg border border-line bg-surface p-4">
				<a href="/p/{post.original.id}" class="flex items-center gap-3 text-fg no-underline">
					<Avatar user={post.original.author} size={32} />
					<span class="min-w-0"
						><strong class="block truncate text-sm">{post.original.author.displayName}</strong><span
							class="text-xs text-fg-muted">@{post.original.author.username}</span
						></span
					>
				</a>
				{#if post.original.caption}<p
						class="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm"
					>
						{post.original.caption}
					</p>{/if}
				{#if post.original.media[0]}
					<div
						class="mt-3 max-w-sm overflow-hidden rounded bg-muted"
						style:aspect-ratio={frameRatio(post.original.media[0])}
					>
						<MediaItem
							media={post.original.media[0]}
							alt={post.original.caption || post.original.author.displayName}
						/>
					</div>
				{/if}
				<a href="/p/{post.original.id}" class="mt-3 inline-block text-sm text-fg-muted"
					>{$_('post.viewOriginal')}</a
				>
			</div>
		{:else}
			<p class="mx-4 text-sm text-fg-muted">{$_('post.originalUnavailable')}</p>
		{/if}
	{/if}

	{#if layout === 'single'}
		<div class="mx-4 bg-muted" style:aspect-ratio={frameRatio(post.media[0])}>
			<MediaItem media={post.media[0]} {alt} />
		</div>
	{:else if layout === 'gallery'}
		<div class="mx-4">
			<MediaGallery media={post.media} {alt} />
		</div>
	{:else if layout === 'reel'}
		<div class="mx-auto w-[calc(100%-2rem)] max-w-sm bg-black" style:aspect-ratio={REEL_RATIO}>
			<MediaItem media={post.media[0]} {alt} />
		</div>
	{/if}

	{#if post.activity?.likedBy.length}
		<div class="px-4">
			<PostActivity postId={post.id} activity={post.activity} likeCount={post.counts.likes} />
		</div>
	{/if}

	<div class="px-4">
		<PostActions
			counts={post.counts}
			viewer={post.viewer}
			postId={loggedIn === undefined ? undefined : post.id}
			loggedIn={Boolean(loggedIn)}
			{onLike}
			onComment={onComment ?? (() => void goto(`/p/${post.id}#comments`))}
			onShare={onShare ?? (() => (shareDialogOpen = true))}
			{onSave}
		/>
	</div>

	{#if editing}
		<div class="flex justify-end gap-2 px-4">
			<Button href="/p/{post.id}" variant="ghost">{$_('post.cancel')}</Button>
			<Button type="submit" form="post-edit-form" variant="primary">{$_('post.saveChanges')}</Button
			>
		</div>
	{/if}
</article>

<SharePostDialog {post} open={shareDialogOpen} onclose={() => (shareDialogOpen = false)} />

<ConfirmationDialog
	open={deleteDialogOpen}
	title={$_('post.deleteTitle')}
	message={$_('post.deleteConfirm')}
	cancelLabel={$_('post.cancel')}
	oncancel={() => (deleteDialogOpen = false)}
>
	{#snippet children()}
		<form method="POST" action="/p/{post.id}?/delete">
			<button
				type="submit"
				class="min-h-11 cursor-pointer border border-danger bg-danger px-5 py-2 text-body text-white hover:opacity-90"
				>{$_('post.delete')}</button
			>
		</form>
	{/snippet}
</ConfirmationDialog>

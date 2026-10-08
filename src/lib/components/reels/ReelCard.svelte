<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { sharePost } from '$lib/posts/share-post'
	import { showToast } from '$lib/toast/toast-state'
	import type { Post } from '$lib/contract'
	import { playVisible } from '$lib/media/play-visible'
	import PostActions from '$lib/components/post/PostActions.svelte'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import PostMenu from '$lib/components/post/PostMenu.svelte'
	let { post }: { post: Post } = $props()
	const media = $derived(post.media[0])
	let deleteDialogOpen = $state(false)

	async function share() {
		const outcome = await sharePost(post.shareUrl, post.caption || post.author.displayName, {
			share: navigator.share?.bind(navigator),
			clipboard: navigator.clipboard,
		})
		if (outcome === 'copied') showToast($_('post.copied'))
		if (outcome === 'failed') showToast($_(errorMessageKey('INTERNAL')))
	}

	function menuAction(action: 'edit' | 'delete' | 'report') {
		if (action === 'edit') void goto(`/p/${post.id}?edit=1`)
		if (action === 'delete') deleteDialogOpen = true
	}
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
		</div>
	</div>
	<div class="reel-actions">
		<PostActions
			counts={post.counts}
			viewer={post.viewer}
			postId={post.id}
			onComment={() => void goto(`/p/${post.id}#comments`)}
			onShare={share}
		/>
		<div class="reel-menu"><PostMenu {post} onAction={menuAction} /></div>
	</div>
</article>

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

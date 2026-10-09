<script lang="ts">
	import Bookmark from '@lucide/svelte/icons/bookmark'
	import Heart from '@lucide/svelte/icons/heart'
	import MessageCircle from '@lucide/svelte/icons/message-circle'
	import Send from '@lucide/svelte/icons/send'
	import { _, locale } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { likeFromData, saveFromData } from '$lib/posts/reaction-result'
	import { showToast } from '$lib/toast/toast-state'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { formatCount } from '$lib/posts/format-count'
	import type { Post } from '$lib/types/post'
	import ReactionButton from './ReactionButton.svelte'

	let {
		counts,
		viewer,
		postId,
		loggedIn = true,
		onLike,
		onComment,
		onShare,
		onSave,
	}: {
		counts: Post['counts']
		viewer: Post['viewer']
		postId?: string
		loggedIn?: boolean
		onLike?: () => void
		onComment?: () => void
		onShare?: () => void
		onSave?: () => void
	} = $props()

	const lang = $derived($locale ?? 'en')
	const filled = 'text-accent [&_svg]:fill-current'
	// The action state is intentionally local so the button responds before the server action completes.
	// svelte-ignore state_referenced_locally
	let liked = $state(viewer.liked)
	// svelte-ignore state_referenced_locally
	let saved = $state(viewer.saved)
	// svelte-ignore state_referenced_locally
	let likes = $state(counts.likes)

	function failure(code: string) {
		showToast($_(errorMessageKey(code)))
	}
</script>

<div class="post-actions flex items-center gap-1">
	<div class="action-item">
		{#if postId}
			<ReactionButton
				action="like"
				{postId}
				next={!liked}
				label={$_('post.like')}
				icon="heart"
				filled={liked}
				tone={liked ? 'text-accent' : 'text-fg-muted'}
				{loggedIn}
				onbegin={() => {
					liked = !liked
					onLike?.()
				}}
				onsuccess={(data) => {
					const result = likeFromData(data)
					if (result) {
						liked = result.liked
						likes = result.likes
					}
				}}
				onfailure={(code) => {
					liked = !liked
					failure(code)
				}}
			/>
		{:else}
			<IconButton
				icon={Heart}
				label={$_('post.like')}
				pressed={viewer.liked}
				onclick={onLike}
				class={viewer.liked ? filled : ''}
			/>
		{/if}
		{#if postId}<a
				href="/p/{postId}/likes"
				class="action-count min-w-6 text-sm tabular-nums text-fg no-underline"
				aria-label="{likes} {$_('post.likes')}">{formatCount(likes, lang)}</a
			>{:else}<span class="action-count min-w-6 text-sm tabular-nums"
				>{formatCount(likes, lang)}</span
			>{/if}
	</div>

	<div class="action-item">
		<IconButton icon={MessageCircle} label={$_('post.comment')} onclick={onComment} />
		{#if postId}<a
				href="/p/{postId}#comments"
				class="action-count min-w-6 text-sm tabular-nums text-fg no-underline"
				aria-label="{counts.comments} {$_('post.comments')}">{formatCount(counts.comments, lang)}</a
			>{:else}<span class="action-count min-w-6 text-sm tabular-nums"
				>{formatCount(counts.comments, lang)}</span
			>{/if}
	</div>

	<div class="action-item">
		<IconButton icon={Send} label={$_('post.share')} onclick={onShare} />
	</div>

	{#if postId}
		<div class="action-item save-action">
			<ReactionButton
				action="save"
				{postId}
				next={!saved}
				label={$_('post.save')}
				icon="bookmark"
				filled={saved}
				tone="text-fg-muted"
				{loggedIn}
				onbegin={() => {
					saved = !saved
					onSave?.()
				}}
				onsuccess={(data) => {
					const result = saveFromData(data)
					if (result) saved = result.saved
				}}
				onfailure={(code) => {
					saved = !saved
					failure(code)
				}}
			/>
		</div>
	{:else}
		<div class="action-item save-action">
			<IconButton
				icon={Bookmark}
				label={$_('post.save')}
				pressed={viewer.saved}
				onclick={onSave}
				class={viewer.saved ? '[&_svg]:fill-current' : ''}
			/>
		</div>
	{/if}
</div>

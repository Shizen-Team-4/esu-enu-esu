<script lang="ts">
	import { untrack } from 'svelte'
	import Bookmark from '@lucide/svelte/icons/bookmark'
	import Heart from '@lucide/svelte/icons/heart'
	import MessageCircle from '@lucide/svelte/icons/message-circle'
	import Repeat2 from '@lucide/svelte/icons/repeat-2'
	import { _, locale } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { likeFromData, saveFromData } from '$lib/posts/reaction-result'
	import { toggleLike, toggleSave } from '$lib/posts/optimistic-toggle'
	import { showToast } from '$lib/toast/toast-state'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { formatCount } from '$lib/posts/format-count'
	import type { Post } from '$lib/types/post'
	import ReactionButton from './ReactionButton.svelte'

	let {
		counts,
		viewer,
		postId,
		loggedIn = false,
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
	const filled = 'text-destructive [&_svg]:fill-current'
	let liked = $state(untrack(() => viewer.liked))
	let saved = $state(untrack(() => viewer.saved))
	let likes = $state(untrack(() => counts.likes))
	let likeBefore = { liked: false, likes: 0 }
	let saveBefore = { saved: false }
	$effect(() => {
		liked = viewer.liked
		likes = counts.likes
		saved = viewer.saved
	})

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
				tone="text-fg"
				{loggedIn}
				onbegin={() => {
					likeBefore = { liked, likes }
					;({ liked, likes } = toggleLike(likeBefore))
					onLike?.()
				}}
				onsuccess={(data) => {
					const result = likeFromData(data)
					if (result) ({ liked, likes } = result)
					else {
						;({ liked, likes } = likeBefore)
						failure('INTERNAL')
					}
				}}
				onfailure={(code) => {
					;({ liked, likes } = likeBefore)
					failure(code)
				}}
			/>
		{:else}
			<IconButton
				icon={Heart}
				label={$_('post.like')}
				pressed={liked}
				onclick={onLike}
				class={liked ? filled : ''}
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
		<IconButton icon={Repeat2} label={$_('post.repost')} onclick={onShare} />
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
				tone="text-fg"
				{loggedIn}
				onbegin={() => {
					saveBefore = { saved }
					;({ saved } = toggleSave(saveBefore))
					onSave?.()
				}}
				onsuccess={(data) => {
					const result = saveFromData(data)
					if (result) ({ saved } = result)
					else {
						;({ saved } = saveBefore)
						failure('INTERNAL')
					}
				}}
				onfailure={(code) => {
					;({ saved } = saveBefore)
					failure(code)
				}}
			/>
		</div>
	{:else}
		<div class="action-item save-action">
			<IconButton
				icon={Bookmark}
				label={$_('post.save')}
				pressed={saved}
				onclick={onSave}
				class={saved ? '[&_svg]:fill-current' : ''}
			/>
		</div>
	{/if}
</div>

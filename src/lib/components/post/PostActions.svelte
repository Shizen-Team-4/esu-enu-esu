<script lang="ts">
	import { untrack } from 'svelte'
	import Bookmark from '@lucide/svelte/icons/bookmark'
	import Heart from '@lucide/svelte/icons/heart'
	import MessageCircle from '@lucide/svelte/icons/message-circle'
	import Send from '@lucide/svelte/icons/send'
	import { _, locale } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { formatCount } from '$lib/posts/format-count'
	import { likeFromData, saveFromData } from '$lib/posts/reaction-result'
	import { toggleLike, toggleSave } from '$lib/posts/optimistic-toggle'
	import { showToast } from '$lib/toast/toast-state'
	import type { Post } from '$lib/types/post'
	import ReactionButton from './ReactionButton.svelte'
	import ActionButton from './ActionButton.svelte'
	import ShareButton from './ShareButton.svelte'

	let {
		counts,
		viewer,
		postId,
		shareUrl,
		loggedIn = false,
		onLike,
		onComment,
		onShare,
		onSave,
	}: {
		counts: Post['counts']
		viewer: Post['viewer']
		postId?: string
		shareUrl?: string
		loggedIn?: boolean
		onLike?: () => void
		onComment?: () => void
		onShare?: () => void
		onSave?: () => void
	} = $props()

	const lang = $derived($locale ?? 'en')
	const filled = 'text-destructive [&_svg]:fill-current'
	let liked = $state(untrack(() => viewer.liked))
	let likes = $state(untrack(() => counts.likes))
	let saved = $state(untrack(() => viewer.saved))
	let likeBefore = { liked: false, likes: 0 }
	let saveBefore = { saved: false }
	$effect(() => {
		liked = viewer.liked
		likes = counts.likes
		saved = viewer.saved
	})
	function fail(code: string) {
		showToast($_(errorMessageKey(code)))
	}
</script>

<div class="post-actions">
	{#if postId && !onLike}
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
			}}
			onsuccess={(data) => {
				const result = likeFromData(data)
				if (result) ({ liked, likes } = result)
				else {
					;({ liked, likes } = likeBefore)
					fail('INTERNAL')
				}
			}}
			onfailure={(code) => {
				;({ liked, likes } = likeBefore)
				fail(code)
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
	<span class="post-action-count">{formatCount(likes, lang)}</span>

	{#if postId && !onComment}
		<ActionButton
			href="/p/{postId}#comments"
			icon="comment"
			label={$_('post.comment')}
			tone="text-fg"
		/>
	{:else}<IconButton icon={MessageCircle} label={$_('post.comment')} onclick={onComment} />{/if}
	<span class="post-action-count">{formatCount(counts.comments, lang)}</span>

	{#if shareUrl && !onShare}
		<ShareButton url={shareUrl} title={$_('post.share')} />
	{:else}<IconButton icon={Send} label={$_('post.share')} onclick={onShare} />{/if}

	<div class="post-action-save">
		{#if postId && !onSave}
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
				}}
				onsuccess={(data) => {
					const result = saveFromData(data)
					if (result) ({ saved } = result)
					else {
						;({ saved } = saveBefore)
						fail('INTERNAL')
					}
				}}
				onfailure={(code) => {
					;({ saved } = saveBefore)
					fail(code)
				}}
			/>
		{:else}
			<IconButton
				icon={Bookmark}
				label={$_('post.save')}
				pressed={saved}
				onclick={onSave}
				class={saved ? '[&_svg]:fill-current' : ''}
			/>
		{/if}
	</div>
</div>

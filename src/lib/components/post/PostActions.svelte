<script lang="ts">
	import { untrack } from 'svelte'
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import { errorMessageKey } from '$lib/errors/error-message'
	import {
		reconcileLike,
		reconcileSave,
		revert,
		toggleLike,
		toggleSave,
		type LikeState,
		type SaveState,
	} from '$lib/posts/optimistic-toggle'
	import { likeFromData, saveFromData } from '$lib/posts/reaction-result'
	import { showToast } from '$lib/toast/toast-state'
	import { focusCommentInput } from '$lib/comments/focus-comment-input'
	import ActionButton from './ActionButton.svelte'
	import ReactionButton from './ReactionButton.svelte'
	import ShareButton from './ShareButton.svelte'

	let { post }: { post: Post } = $props()

	let like = $state<LikeState>(
		untrack(() => ({ liked: post.viewer.liked, likes: post.counts.likes })),
	)
	let save = $state<SaveState>(untrack(() => ({ saved: post.viewer.saved })))
	let likeBefore: LikeState = { liked: false, likes: 0 }
	let saveBefore: SaveState = { saved: false }
	const loggedIn = $derived(Boolean(page.data.me))
	const onPostPage = $derived(page.url.pathname === `/p/${encodeURIComponent(post.id)}`)

	const failed = (code: string) => showToast($_(errorMessageKey(code)))
</script>

<div class="flex items-center justify-between px-1 py-1">
	<div class="flex items-center">
		<ReactionButton
			action="like"
			postId={post.id}
			next={!like.liked}
			label={like.liked ? $_('post.unlike') : $_('post.like')}
			icon="heart"
			filled={like.liked}
			tone={like.liked ? 'text-accent' : 'text-fg-muted'}
			count={like.likes}
			{loggedIn}
			onbegin={() => {
				likeBefore = { ...like }
				like = toggleLike(like)
			}}
			onsuccess={(data) => {
				const result = likeFromData(data)
				like = result ? reconcileLike(like, result) : revert(likeBefore)
			}}
			onfailure={(code) => {
				like = revert(likeBefore)
				failed(code)
			}}
		/>
		<ActionButton
			href={onPostPage ? undefined : `/p/${post.id}#comments`}
			type={onPostPage ? 'button' : undefined}
			onclick={onPostPage ? () => focusCommentInput(document) : undefined}
			icon="comment"
			label={$_('post.comments')}
			count={post.counts.comments}
		/>
	</div>
	<div class="flex items-center">
		<ReactionButton
			action="save"
			postId={post.id}
			next={!save.saved}
			label={save.saved ? $_('post.unsave') : $_('post.save')}
			icon="bookmark"
			filled={save.saved}
			tone={save.saved ? 'text-primary' : 'text-fg-muted'}
			{loggedIn}
			onbegin={() => {
				saveBefore = { ...save }
				save = toggleSave(save)
			}}
			onsuccess={(data) => {
				const result = saveFromData(data)
				save = result ? reconcileSave(save, result) : revert(saveBefore)
			}}
			onfailure={(code) => {
				save = revert(saveBefore)
				failed(code)
			}}
		/>
		<ShareButton url={post.shareUrl} title={post.author.displayName} />
	</div>
</div>

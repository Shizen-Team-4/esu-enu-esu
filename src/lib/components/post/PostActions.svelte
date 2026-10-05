<script lang="ts">
	import Bookmark from '@lucide/svelte/icons/bookmark'
	import Heart from '@lucide/svelte/icons/heart'
	import MessageCircle from '@lucide/svelte/icons/message-circle'
	import Send from '@lucide/svelte/icons/send'
	import { _, locale } from 'svelte-i18n'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import { formatCount } from '$lib/posts/format-count'
	import type { Post } from '$lib/types/post'

	let {
		counts,
		viewer,
		onLike,
		onComment,
		onShare,
		onSave,
	}: {
		counts: Post['counts']
		viewer: Post['viewer']
		onLike?: () => void
		onComment?: () => void
		onShare?: () => void
		onSave?: () => void
	} = $props()

	const lang = $derived($locale ?? 'en')
	const filled = 'text-destructive [&_svg]:fill-current'
</script>

<div class="flex items-center gap-1">
	<IconButton
		icon={Heart}
		label={$_('post.like')}
		pressed={viewer.liked}
		onclick={onLike}
		class={viewer.liked ? filled : ''}
	/>
	<span class="min-w-6 text-sm tabular-nums">{formatCount(counts.likes, lang)}</span>

	<IconButton icon={MessageCircle} label={$_('post.comment')} onclick={onComment} />
	<span class="min-w-6 text-sm tabular-nums">{formatCount(counts.comments, lang)}</span>

	<IconButton icon={Send} label={$_('post.share')} onclick={onShare} />

	<IconButton
		icon={Bookmark}
		label={$_('post.save')}
		pressed={viewer.saved}
		onclick={onSave}
		class={viewer.saved ? 'ml-auto [&_svg]:fill-current' : 'ml-auto'}
	/>
</div>

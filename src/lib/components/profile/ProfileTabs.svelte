<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Tabs from '$lib/components/ui/Tabs.svelte'
	let { type = 'post', isMe = false }: { type?: string; isMe?: boolean } = $props()
	const items = $derived([
		{ href: '?type=post', label: $_('profile.posts'), active: type === 'post' },
		{ href: '?type=reel', label: $_('nav.reels'), active: type === 'reel' },
		...(isMe
			? [{ href: '?type=bookmarks', label: $_('nav.bookmarks'), active: type === 'bookmarks' }]
			: []),
	])
</script>

<Tabs
	{items}
	label={$_('profile.content')}
	position="top"
	replaceState
	class="mt-5.5 border-t border-line md:mt-7.5"
/>

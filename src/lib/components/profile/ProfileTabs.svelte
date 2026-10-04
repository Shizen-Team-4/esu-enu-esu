<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Tabs from '$lib/components/ui/Tabs.svelte'
	let { type = 'post' }: { type?: string } = $props()
	const items = $derived([
		{ href: '?type=post', label: $_('profile.posts'), active: type !== 'reel' },
		{ href: '?type=reel', label: $_('nav.reels'), active: type === 'reel' },
	])
</script>

<Tabs
	{items}
	label={$_('profile.content')}
	position="top"
	replaceState
	class="mt-5.5 border-t border-line md:mt-7.5"
/>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	let { type = 'post' }: { type?: string } = $props()
</script>

<nav class="mb-1 flex justify-center border-y border-line" aria-label={$_('profile.content')}>
	<Button
		href="?type=post"
		variant="ghost"
		aria-current={type === 'post' ? 'page' : undefined}
		class="aria-[current=page]:text-primary">{$_('profile.posts')}</Button
	>
	<Button
		href="?type=reel"
		variant="ghost"
		aria-current={type === 'reel' ? 'page' : undefined}
		class="aria-[current=page]:text-primary">{$_('nav.reels')}</Button
	>
</nav>

<script lang="ts">
	import { _ } from 'svelte-i18n'
	let { type = 'post' }: { type?: string } = $props()
</script>

<nav class="mb-1 flex justify-center border-y border-line" aria-label={$_('profile.content')}>
	<a href="?type=post" class="button" aria-current={type === 'post' ? 'page' : undefined}
		>{$_('profile.posts')}</a
	>
	<a href="?type=reel" class="button" aria-current={type === 'reel' ? 'page' : undefined}
		>{$_('nav.reels')}</a
	>
</nav>

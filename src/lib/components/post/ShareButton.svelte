<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { sharePost } from '$lib/posts/share-post'
	import { showToast } from '$lib/toast/toast-state'
	import ActionButton from './ActionButton.svelte'

	let { url, title }: { url: string; title: string } = $props()

	async function share() {
		const outcome = await sharePost(url, title, {
			share: navigator.share?.bind(navigator),
			clipboard: navigator.clipboard,
		})
		if (outcome === 'copied') showToast($_('post.copied'))
		if (outcome === 'failed') showToast($_(errorMessageKey('INTERNAL')))
	}
</script>

<ActionButton type="button" icon="share" label={$_('post.share')} onclick={share} />

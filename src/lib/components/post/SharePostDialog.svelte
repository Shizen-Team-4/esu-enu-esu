<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { sharePost } from '$lib/posts/share-post'
	import { showToast } from '$lib/toast/toast-state'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'

	let { post, open, onclose }: { post: Post; open: boolean; onclose: () => void } = $props()

	async function copyLink() {
		const outcome = await sharePost(post.shareUrl, post.caption || post.author.displayName, {
			clipboard: navigator.clipboard,
		})
		if (outcome === 'copied') showToast($_('post.copied'))
		if (outcome === 'failed') showToast($_(errorMessageKey('INTERNAL')))
		onclose()
	}
</script>

<ConfirmationDialog
	{open}
	title={$_('post.share')}
	message={$_('post.sharePrompt')}
	cancelLabel={$_('post.cancel')}
	oncancel={onclose}
>
	{#snippet children()}
		<button type="button" class="min-h-11 px-3 text-sm text-fg" onclick={copyLink}
			>{$_('post.copyLink')}</button
		>
		<form
			method="POST"
			action="/p/{post.id}?/repost"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						const code =
							(result.data as { error?: { code?: string } } | undefined)?.error?.code ?? 'INTERNAL'
						showToast($_(errorMessageKey(code)))
					} else await update()
				}}
		>
			<button type="submit" class="min-h-11 bg-accent px-4 text-sm font-semibold text-white"
				>{$_('post.repost')}</button
			>
		</form>
	{/snippet}
</ConfirmationDialog>

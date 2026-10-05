<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import type { Comment } from '$lib/contract'
	import { errorCodeFromData } from '$lib/posts/reaction-result'
	import { errorMessageKey } from '$lib/errors/error-message'
	import Button from '$lib/components/ui/Button.svelte'

	let { comment, onDeleted }: { comment: Comment; onDeleted: (comment: Comment) => void } = $props()
	let confirming = $state(false)
	let pending = $state(false)
	let error = $state<string | null>(null)
</script>

<button
	type="button"
	class="min-h-11 cursor-pointer px-2 text-meta text-fg-muted"
	onclick={() => (confirming = true)}>{$_('post.delete')}</button
>
{#if confirming}
	<div
		class="basis-full border-t border-line py-3"
		role="group"
		aria-label={$_('comments.confirmDelete')}
	>
		<p class="mb-2 text-body">
			{$_('comments.confirmDelete')}
		</p>
		<form
			method="POST"
			action="?/deleteComment"
			use:enhance={() => {
				pending = true
				error = null
				return async ({ result, update }) => {
					pending = false
					if (result.type === 'success') {
						await update({ reset: false, invalidateAll: false })
						onDeleted(comment)
					} else if (result.type === 'redirect') await update()
					else error = result.type === 'failure' ? errorCodeFromData(result.data) : 'INTERNAL'
				}
			}}
			class="flex flex-wrap gap-2"
		>
			<input type="hidden" name="id" value={comment.id} />
			<Button
				type="button"
				disabled={pending}
				onclick={() => {
					confirming = false
					error = null
				}}>{$_('comments.cancel')}</Button
			>
			<Button type="submit" disabled={pending}
				>{$_(pending ? 'comments.deleting' : 'post.delete')}</Button
			>
		</form>
		{#if error}<p role="alert" class="mt-2 text-body">{$_(errorMessageKey(error))}</p>{/if}
	</div>
{/if}

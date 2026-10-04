<script lang="ts">
	import { enhance } from '$app/forms'
	import { untrack } from 'svelte'
	import { _ } from 'svelte-i18n'
	import type { Comment, ErrorEnvelope, UserSummary } from '$lib/contract'
	import { COMMENT_BODY_MAX } from '$lib/contract'
	import { canSubmitComment } from '$lib/comments/composer-state'
	import { autoSizeTextarea } from '$lib/comments/auto-size-textarea'
	import { charCount } from '$lib/format/char-count'
	import { errorCodeFromData } from '$lib/posts/reaction-result'
	import { errorMessageKey } from '$lib/errors/error-message'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import FieldError from '$lib/components/FieldError.svelte'

	let {
		me,
		target,
		body = $bindable(''),
		fallbackParentId = $bindable(''),
		initialError,
		notice,
		oncancel,
		onCreated,
	}: {
		me: UserSummary | null
		target: Comment | null
		body?: string
		fallbackParentId?: string
		initialError?: ErrorEnvelope['error']
		notice?: string | null
		oncancel: () => void
		onCreated: (comment: Comment) => void
	} = $props()
	let error = $state<string | null>(untrack(() => initialError?.code ?? null))
	let fieldError = $state(untrack(() => initialError?.fields?.body))
	let pending = $state(false)
	let input = $state<HTMLTextAreaElement>()
	$effect(() => {
		if (target) input?.focus()
	})
</script>

{#if me}
	<form
		method="POST"
		action="?/comment"
		class="grid gap-2 py-3"
		use:enhance={() => {
			pending = true
			error = null
			fieldError = undefined
			return async ({ result, update }) => {
				pending = false
				if (result.type === 'success' && result.data?.comment) {
					await update({ reset: false, invalidateAll: false })
					body = ''
					fallbackParentId = ''
					onCreated(result.data.comment as Comment)
				} else if (result.type === 'redirect') await update()
				else {
					error = result.type === 'failure' ? errorCodeFromData(result.data) : 'INTERNAL'
					if (result.type === 'failure')
						fieldError = (result.data as unknown as ErrorEnvelope)?.error?.fields?.body
				}
			}
		}}
	>
		<input type="hidden" name="parentId" value={target?.id ?? fallbackParentId} />
		{#if target}<div
				class="flex min-w-0 items-center justify-between gap-2 text-meta text-fg-muted"
			>
				<span class="truncate"
					>{$_('comments.replyingTo', { values: { username: target.author.username } })}</span
				>
				<button
					type="button"
					disabled={pending}
					class="min-h-11 shrink-0 cursor-pointer px-2 disabled:cursor-not-allowed"
					onclick={oncancel}>{$_('comments.cancelReply')}</button
				>
			</div>{/if}
		<div class="flex items-start gap-3">
			{#if !target}<Avatar src={me.avatarUrl} name={me.displayName} />{/if}
			<div class="min-w-0 flex-1">
				<label for="comment-body" class="sr-only">{$_('comments.write')}</label>
				<textarea
					use:autoSizeTextarea={body}
					bind:this={input}
					bind:value={body}
					id="comment-body"
					name="body"
					rows="2"
					required
					readonly={pending}
					placeholder={$_(target ? 'comments.writeReply' : 'comments.write')}
					aria-invalid={Boolean(fieldError) || charCount(body.trim()) > COMMENT_BODY_MAX}
					aria-describedby={fieldError ? 'comment-counter comment-error' : 'comment-counter'}
					class="field block min-h-11 w-full resize-none overflow-hidden px-3 py-2 text-body"
				></textarea>
				<p id="comment-counter" class="mt-1 text-meta text-fg-muted">
					{$_('comments.counter', {
						values: { count: charCount(body.trim()), max: COMMENT_BODY_MAX },
					})}
				</p>
				<FieldError id="comment-error" code={fieldError} />
			</div>
		</div>
		<div class="justify-self-end">{@render sendButton()}</div>
		{#if notice && !body && !error && !target}<p role="status" class="text-meta text-fg-muted">
				{$_(notice)}
			</p>{/if}
		{#if error && !fieldError}<p role="alert" class="text-body">
				{$_(errorMessageKey(error))}
			</p>{/if}
	</form>
{:else}
	<div class="flex flex-wrap items-center justify-between gap-3 px-inset py-4">
		<p class="text-body text-fg-muted">{$_('comments.loginHint')}</p>
		<Button href="/login" variant="primary">{$_('auth.login')}</Button>
	</div>
{/if}

{#snippet sendButton()}
	<button
		type="submit"
		disabled={!canSubmitComment(body, pending)}
		class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control disabled:cursor-not-allowed disabled:opacity-50"
	>
		<span
			class="rounded-control border border-primary bg-primary px-3 py-1 text-body text-on-primary"
			>{$_(pending ? 'comments.sending' : 'comments.send')}</span
		>
	</button>
{/snippet}

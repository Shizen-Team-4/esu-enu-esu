<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import type { DirectMessage } from '$lib/contract/message'
	import { newMessageId } from '$lib/messages/client'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { errorCodeFromData } from '$lib/posts/reaction-result'
	import { stickerFromMessage } from '$lib/messages/sticker'
	import MessagePicker from './MessagePicker.svelte'
	let {
		draftId,
		onsent,
		action = '?/send',
	}: { draftId: string; onsent: (message: DirectMessage) => void; action?: string } = $props()
	let body = $state('')
	// svelte-ignore state_referenced_locally
	let id = $state(draftId)
	let pending = $state(false)
	let error = $state<string | null>(null)
	let formElement: HTMLFormElement
	function insert(value: string) {
		if (stickerFromMessage(value)) {
			body = value
			formElement.requestSubmit()
			return
		}
		body += value
	}
	function onComposerKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing || pending || !body.trim())
			return
		if (!window.matchMedia('(min-width: 768px) and (pointer: fine)').matches) return
		event.preventDefault()
		formElement.requestSubmit()
	}
</script>

<form
	bind:this={formElement}
	method="POST"
	{action}
	class="message-composer"
	use:enhance={() => {
		pending = true
		error = null
		return async ({ result }) => {
			pending = false
			if (result.type === 'success' && result.data?.sent) {
				onsent(result.data.sent as DirectMessage)
				body = ''
				id = newMessageId()
			} else error = result.type === 'failure' ? errorCodeFromData(result.data) : 'INTERNAL'
		}
	}}
>
	<input type="hidden" name="id" value={id} />
	<div class="message-input-wrap">
		<MessagePicker onpick={insert} /><textarea
			name="body"
			bind:value={body}
			onkeydown={onComposerKeydown}
			aria-label={$_('messages.placeholder')}
			placeholder={$_('messages.placeholder')}
			rows="1"
			maxlength="2000"
			required
			disabled={pending}></textarea>
		<button type="submit" disabled={pending || !body.trim()}
			>{$_(pending ? 'messages.sending' : 'messages.send')}</button
		>
	</div>
	{#if error}<p role="alert" class="px-3 pt-2 text-sm">{$_(errorMessageKey(error))}</p>{/if}
</form>

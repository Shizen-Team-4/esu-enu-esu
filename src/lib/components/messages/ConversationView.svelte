<script lang="ts">
	import { untrack, tick } from 'svelte'
	import { invalidate } from '$app/navigation'
	import { _, locale } from 'svelte-i18n'
	import type { ConversationPage, DirectMessage } from '$lib/contract/message'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import NavIcon from '$lib/components/NavIcon.svelte'
	import MessageComposer from './MessageComposer.svelte'
	import { fetchConversation, markConversationRead, mergeMessages } from '$lib/messages/client'
	import { startVisiblePolling } from '$lib/notifications/visible-polling'
	import { stickerFromMessage } from '$lib/messages/sticker'
	let {
		initial,
		viewerId,
		draftId,
		mini = false,
	}: { initial: ConversationPage; viewerId: string; draftId: string; mini?: boolean } = $props()
	let conversation = $state(untrack(() => initial.conversation))
	let messages = $state(untrack(() => initial.messages))
	let before = $state(untrack(() => initial.nextBefore))
	let viewport = $state<HTMLDivElement>()
	let loading = $state(false)
	let disconnected = $state(false)
	let reading = false
	let readSequence = 0
	const atBottom = () =>
		!viewport || viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 64
	const time = (value: string) =>
		new Date(value).toLocaleTimeString($locale ?? 'en', { hour: '2-digit', minute: '2-digit' })
	async function readVisible() {
		const last = messages.at(-1)?.sequence
		if (!last || last <= readSequence || reading || document.hidden || !atBottom()) return
		reading = true
		try {
			await markConversationRead(conversation.id, last)
			readSequence = last
			await invalidate('app:messages')
		} catch {
			disconnected = true
		} finally {
			reading = false
		}
	}
	async function scrollToLatest() {
		await tick()
		if (viewport) viewport.scrollTop = viewport.scrollHeight
		await readVisible()
	}
	async function sent(message: DirectMessage) {
		messages = mergeMessages(messages, [message])
		await scrollToLatest()
		await invalidate('app:messages')
	}
	async function older() {
		if (!before || loading || !viewport) return
		loading = true
		const oldHeight = viewport.scrollHeight
		const oldTop = viewport.scrollTop
		try {
			const result = await fetchConversation(conversation.id, before)
			messages = mergeMessages(result.messages, messages)
			before = result.nextBefore
			await tick()
			if (viewport) viewport.scrollTop = oldTop + viewport.scrollHeight - oldHeight
		} catch {
			disconnected = true
		} finally {
			loading = false
		}
	}
	$effect(() => {
		let active = true
		void scrollToLatest()
		const stop = startVisiblePolling(async () => {
			try {
				const result = await fetchConversation(untrack(() => conversation.id))
				if (!active) return
				const follow = atBottom()
				conversation = result.conversation
				messages = mergeMessages(messages, result.messages)
				disconnected = false
				if (follow) await scrollToLatest()
			} catch {
				if (active) disconnected = true
			}
		}, document)
		return () => {
			active = false
			stop()
		}
	})
</script>

<div class="conversation-view">
	<header class="conversation-header">
		{#if !mini}<a
				href="/messages"
				aria-label={$_('common.back')}
				class="grid size-11 place-items-center text-fg md:hidden"
				><NavIcon path="m15 18-6-6 6-6" /></a
			>{/if}
		<Avatar user={conversation.peer} />
		<a href="/u/{conversation.peer.username}" class="min-w-0 text-fg no-underline"
			><strong class="block truncate text-sm">{conversation.peer.displayName}</strong><span
				class="text-xs text-fg-muted">@{conversation.peer.username}</span
			></a
		>
	</header>
	{#if disconnected}<p role="status" class="bg-elevated px-5 py-2 text-center text-xs">
			{$_('messages.reconnecting')}
		</p>{/if}
	<div class="message-history" bind:this={viewport} onscroll={() => void readVisible()}>
		{#if before}<button
				type="button"
				class="mx-auto block min-h-11 text-sm font-semibold text-primary"
				disabled={loading}
				onclick={older}>{$_('messages.older')}</button
			>{/if}
		<div class="conversation-intro">
			<Avatar user={conversation.peer} size={48} /><strong>{conversation.peer.displayName}</strong
			><span class="text-sm text-fg-muted">@{conversation.peer.username}</span><a
				href="/u/{conversation.peer.username}"
				class="mt-2 rounded-lg bg-elevated px-4 py-2 text-sm font-semibold text-fg no-underline"
				>{$_('messages.viewProfile')}</a
			>
		</div>
		<div
			class="message-log"
			role="log"
			aria-label={$_('messages.conversation')}
			aria-live="polite"
			aria-relevant="additions"
		>
			{#each messages as message (message.id)}
				{@const sticker = stickerFromMessage(message.body)}
				<div class="message-row" class:mine={message.senderId === viewerId}>
					{#if sticker}<img
							class="message-sticker"
							src="/stickers/{sticker}.gif"
							alt={$_(`messages.${sticker}`)}
						/>{:else}<p class="message-bubble">{message.body}</p>{/if}
					<time class="message-time" datetime={message.createdAt}>{time(message.createdAt)}</time>
					{#if message === messages.at(-1) && message.senderId === viewerId}<span
							class="text-xs text-fg-muted"
							>{$_(
								message.sequence <= conversation.peerReadSequence
									? 'messages.seen'
									: 'messages.sent',
							)}</span
						>{/if}
				</div>
			{/each}
		</div>
	</div>
	<MessageComposer
		{draftId}
		action={mini ? `/messages/${conversation.id}?/send` : '?/send'}
		onsent={(message) => void sent(message)}
	/>
</div>

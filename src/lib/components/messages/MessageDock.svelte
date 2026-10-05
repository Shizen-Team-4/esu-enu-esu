<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { UserSummary } from '$lib/contract'
	import type { Inbox, ConversationPage } from '$lib/contract/message'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import NavIcon from '$lib/components/NavIcon.svelte'
	import UnreadBadge from '$lib/components/notifications/UnreadBadge.svelte'
	import ConversationView from './ConversationView.svelte'
	import { fetchConversation, newMessageId } from '$lib/messages/client'
	let { me, unreadCount }: { me: UserSummary; unreadCount: number | null } = $props()
	let open = $state(false)
	let inbox = $state<Inbox | null>(null)
	let selected = $state<ConversationPage | null>(null)
	let busy = $state(false)
	let failed = $state(false)
	async function loadInbox() {
		busy = true
		failed = false
		try {
			const response = await fetch('/api/messages')
			if (!response.ok) throw new Error('INBOX')
			inbox = await response.json()
		} catch {
			failed = true
		} finally {
			busy = false
		}
	}
	async function openThread(id: string) {
		busy = true
		failed = false
		try {
			selected = await fetchConversation(id)
		} catch {
			failed = true
		} finally {
			busy = false
		}
	}
	function toggle() {
		open = !open
		if (open) void loadInbox()
		else selected = null
	}
	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false
			selected = null
		}
	}
</script>

<svelte:window onkeydown={onKey} />
{#if open}
	<section class="message-dock-panel" aria-label={$_('nav.messages')}>
		<header class="message-dock-header">
			{#if selected}<button
					type="button"
					onclick={() => {
						selected = null
						void loadInbox()
					}}
					aria-label={$_('common.back')}
					><svg
						viewBox="0 0 24 24"
						class="size-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg
					></button
				>{/if}
			<strong class="flex-1"
				>{selected ? selected.conversation.peer.displayName : $_('nav.messages')}</strong
			>
			<a
				href={selected ? `/messages/${selected.conversation.id}` : '/messages'}
				aria-label={$_('messages.openInbox')}
				title={$_('messages.openInbox')}
				><svg
					viewBox="0 0 24 24"
					class="size-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg
				></a
			>
			<button type="button" onclick={toggle} aria-label={$_('messages.close')}
				><svg
					viewBox="0 0 24 24"
					class="size-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg
				></button
			>
		</header>
		{#if busy}<p class="p-5 text-sm text-fg-muted" role="status">{$_('comments.loading')}</p>{/if}
		{#if failed}<p class="p-5 text-sm" role="alert">
				{$_('messages.reconnecting')}
				<button
					type="button"
					onclick={() => {
						if (selected) void openThread(selected.conversation.id)
						else void loadInbox()
					}}>{$_('common.retry')}</button
				>
			</p>{/if}
		{#if selected}
			{#key selected.conversation.id}<div class="message-dock-chat">
					<ConversationView initial={selected} viewerId={me.id} draftId={newMessageId()} mini />
				</div>{/key}
		{:else if inbox}
			<div class="message-dock-list">
				{#each inbox.items as thread (thread.id)}
					<button
						type="button"
						onclick={() => openThread(thread.id)}
						aria-label="{thread.peer.displayName}: {thread.lastMessage || $_('messages.sayHello')}"
						><Avatar src={thread.peer.avatarUrl} name={thread.peer.displayName} /><span
							class="min-w-0 flex-1 text-left"
							><strong class="block truncate text-sm">{thread.peer.displayName}</strong><small
								class="block truncate text-fg-muted"
								>{thread.lastMessage || $_('messages.sayHello')}</small
							></span
						>{#if thread.unreadCount}<span
								class="size-2 rounded-full bg-primary"
								aria-label={$_('messages.unread')}
							></span>{/if}</button
					>
				{/each}
				{#if !inbox.items.length}<p class="p-5 text-sm text-fg-muted">
						{$_('messages.noConversations')}
					</p>{/if}
			</div>
			<a class="message-dock-new" href="/messages?compose=1">{$_('messages.new')}</a>
		{/if}
	</section>
{/if}
<button
	type="button"
	onclick={toggle}
	class="message-dock"
	aria-expanded={open}
	aria-label={$_('nav.messages')}
>
	<span class="relative inline-flex"
		><NavIcon path="m22 2-7 20-4-9-9-4 20-7z M22 2 11 13" size={28} /><span
			class="absolute -right-2 -bottom-2"><UnreadBadge count={unreadCount} /></span
		></span
	>
	<strong class="flex-1 text-left text-sm">{$_('nav.messages')}</strong><Avatar
		src={me.avatarUrl}
		name={me.displayName}
		size="sm"
	/>
</button>

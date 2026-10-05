<script lang="ts">
	import { page } from '$app/state'
	import MessageDock from '$lib/components/messages/MessageDock.svelte'
	import Header from '$lib/components/Header.svelte'
	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Toast from '$lib/components/ui/Toast.svelte'
	import { afterNavigate } from '$app/navigation'
	import { createUnreadCount } from '$lib/notifications/unread-count'
	import { fetchMessageCount } from '$lib/messages/client'
	import { fetchUnreadCount } from '$lib/notifications/fetch-notifications'
	import { startVisiblePolling } from '$lib/notifications/visible-polling'
	let { children, data } = $props()
	// svelte-ignore state_referenced_locally
	const unread = createUnreadCount(data.unreadCount, fetchUnreadCount)
	// svelte-ignore state_referenced_locally
	const messages = createUnreadCount(data.messageCount, fetchMessageCount)
	let viewerId: string | null = null
	$effect(() => {
		const currentViewer = data.me?.id ?? null
		unread.reset(data.unreadCount, currentViewer === viewerId)
		messages.reset(data.messageCount, currentViewer === viewerId)
		viewerId = currentViewer
	})
	$effect(() => {
		if (!data.me) return
		const stopMessages = startVisiblePolling(() => messages.refresh(), document)
		const stop = startVisiblePolling(() => unread.refresh(), document)
		return () => {
			stop()
			stopMessages()
			messages.cancel()
			unread.cancel()
		}
	})
	afterNavigate(() => {
		if (data.me) {
			void unread.refresh()
			void messages.refresh()
		}
	})
</script>

<div class="app-frame">
	<Sidebar me={data.me} unreadCount={$unread} messageCount={$messages} />
	<div class="app-workspace">
		{#if !page.url.pathname.startsWith('/messages') && page.url.pathname !== '/reels'}<Header
				me={data.me}
			/>{/if}
		<main
			class="app-content"
			class:wide-content={page.url.pathname.startsWith('/u/')}
			class:full-content={page.url.pathname.startsWith('/messages') ||
				page.url.pathname === '/reels'}
			class:post-content={page.url.pathname.startsWith('/p/')}
		>
			{@render children()}
		</main>
	</div>
	<Navigation me={data.me} messageCount={$messages} />
	{#if data.me && !page.url.pathname.startsWith('/messages')}<MessageDock
			me={data.me}
			unreadCount={$messages}
		/>{/if}
	<Toast />
</div>

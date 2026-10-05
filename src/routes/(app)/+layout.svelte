<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Toast from '$lib/components/ui/Toast.svelte'
	import { afterNavigate } from '$app/navigation'
	import { createUnreadCount } from '$lib/notifications/unread-count'
	import { fetchUnreadCount } from '$lib/notifications/fetch-notifications'
	import { startVisiblePolling } from '$lib/notifications/visible-polling'
	let { children, data } = $props()
	// svelte-ignore state_referenced_locally
	const unread = createUnreadCount(data.unreadCount, fetchUnreadCount)
	let viewerId: string | null = null
	$effect(() => {
		const currentViewer = data.me?.id ?? null
		unread.reset(data.unreadCount, currentViewer === viewerId)
		viewerId = currentViewer
	})
	$effect(() => {
		if (!data.me) return
		const stop = startVisiblePolling(() => unread.refresh(), document)
		return () => {
			stop()
			unread.cancel()
		}
	})
	afterNavigate(() => {
		if (data.me) void unread.refresh()
	})
</script>

<div class="min-h-dvh md:pl-rail lg:pl-0">
	<Header me={data.me} />
	<div
		class="mx-auto lg:grid lg:max-w-[calc(var(--spacing-sidebar)+var(--container-content)+var(--spacing-aside))] lg:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)_var(--spacing-aside)]"
	>
		<Sidebar me={data.me} unreadCount={$unread} />
		<main
			class="mx-auto min-h-[calc(100dvh-var(--spacing-app-header))] w-full max-w-content px-gutter pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 lg:border-x lg:border-line"
		>
			{@render children()}
		</main>
		<div class="hidden lg:block" aria-hidden="true"></div>
	</div>
	<Navigation me={data.me} unreadCount={$unread} />
	<Toast />
</div>

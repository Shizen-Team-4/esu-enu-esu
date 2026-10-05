<script lang="ts">
	import { page } from '$app/state'
	import { invalidate } from '$app/navigation'
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import NavIcon from '$lib/components/NavIcon.svelte'
	import { startVisiblePolling } from '$lib/notifications/visible-polling'
	let { data, children } = $props()
	$effect(() => startVisiblePolling(() => invalidate('app:messages'), document))
	const selected = $derived(page.params.id)
</script>

<div
	class="inbox-shell"
	class:conversation-open={Boolean(selected)}
	class:composing={page.url.searchParams.has('compose') ||
		Boolean(page.url.searchParams.get('to')) ||
		Boolean(page.url.searchParams.get('q'))}
>
	<aside class="inbox-sidebar">
		<header class="flex items-center justify-between gap-3 px-6 pt-8 pb-5">
			<h1 class="truncate text-xl font-semibold">{data.me?.username || $_('nav.messages')}</h1>
			<a
				href="/messages?compose=1"
				class="grid size-11 shrink-0 place-items-center rounded-full text-fg hover:bg-elevated"
				aria-label={$_('messages.new')}
				><NavIcon path="M12 20H4V4h10 M14 4l6-2 2 2-12 12-4 1 1-4z" /></a
			>
		</header>
		<div class="flex items-center justify-between px-6 pb-4">
			<h2 class="font-semibold">{$_('nav.messages')}</h2>
			<a href="/messages?compose=1" class="text-sm font-semibold text-primary"
				>{$_('messages.new')}</a
			>
		</div>
		<nav aria-label={$_('messages.conversations')} class="inbox-list">
			{#each data.inbox.items as thread (thread.id)}
				<a
					href="/messages/{thread.id}"
					class="inbox-row"
					class:selected={selected === thread.id}
					aria-current={selected === thread.id ? 'page' : undefined}
				>
					<Avatar user={thread.peer} size={48} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm" class:font-semibold={thread.unreadCount > 0}>
							{thread.peer.displayName}
						</p>
						<p class="truncate text-sm text-fg-muted">
							{thread.lastMessage || $_('messages.sayHello')}
						</p>
					</div>
					{#if thread.unreadCount > 0}<span
							class="size-2 shrink-0 rounded-full bg-primary"
							aria-label={$_('messages.unread')}
						></span>{/if}
				</a>
			{/each}
			{#if !data.inbox.items.length}<p class="px-6 py-8 text-sm text-fg-muted">
					{$_('messages.noConversations')}
				</p>{/if}
			{#if data.inbox.nextCursor}<a
					class="block p-5 text-center text-primary"
					href="?cursor={data.inbox.nextCursor}">{$_('feed.more')}</a
				>{/if}
		</nav>
	</aside>
	<section class="inbox-detail">{@render children()}</section>
</div>

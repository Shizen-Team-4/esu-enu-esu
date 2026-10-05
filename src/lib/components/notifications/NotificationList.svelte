<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Notification, Page } from '$lib/contract'
	import { fetchNotifications } from '$lib/notifications/fetch-notifications'
	import { createNotificationList } from '$lib/notifications/notification-list'
	import { startVisiblePolling } from '$lib/notifications/visible-polling'
	import { errorMessageKey } from '$lib/errors/error-message'
	import NotificationRow from './NotificationRow.svelte'
	import Button from '../ui/Button.svelte'
	import EmptyState from '../ui/EmptyState.svelte'
	import ErrorState from '../ui/ErrorState.svelte'
	let {
		initial,
		cursor,
		errorCode,
	}: { initial: Page<Notification> | null; cursor: string | null; errorCode: string | null } =
		$props()
	// svelte-ignore state_referenced_locally
	const list = createNotificationList(
		initial ?? { items: [], nextCursor: null },
		fetchNotifications,
		(value) => {
			snapshot = value
		},
		errorCode,
	)
	let snapshot = $state.raw(list.snapshot)
	let now = $state(new Date())
	$effect(() => {
		list.reset(initial, cursor, errorCode)
	})
	$effect(() => {
		const stop = startVisiblePolling(async () => {
			const result = await list.refresh()
			now = new Date()
			return result
		}, document)
		return () => {
			stop()
			list.dispose()
		}
	})
</script>

{#if snapshot.items.length === 0 && snapshot.errorCode === null && !snapshot.loading}
	<EmptyState title={$_('notifications.empty')} />
{:else}
	<ul
		class="m-0 list-none divide-y divide-line border-y border-line bg-surface p-0"
		aria-busy={snapshot.loading}
	>
		{#each snapshot.items as notification (notification.id)}
			<NotificationRow {notification} {now} />
		{/each}
	</ul>
{/if}
{#if snapshot.errorCode}
	<ErrorState
		message={$_(errorMessageKey(snapshot.errorCode))}
		onretry={() => {
			void list.retry()
		}}
	/>
	<noscript><a class="block py-4" href="/notifications">{$_('error.retry')}</a></noscript>
{:else if snapshot.loading}
	<p role="status" class="py-4 text-center text-meta text-fg-muted">
		{$_('notifications.loading')}
	</p>
{/if}
{#if snapshot.nextCursor !== null}
	<div class="flex justify-center py-4">
		<Button
			disabled={snapshot.loading}
			onclick={() => {
				void list.loadMore()
			}}>{$_('notifications.more')}</Button
		>
	</div>
	<noscript
		><a class="block py-4" href="?cursor={encodeURIComponent(snapshot.nextCursor)}"
			>{$_('notifications.more')}</a
		></noscript
	>
{/if}

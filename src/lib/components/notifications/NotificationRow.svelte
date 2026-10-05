<script lang="ts">
	import { enhance } from '$app/forms'
	import { _, locale } from 'svelte-i18n'
	import type { Notification } from '$lib/contract'
	import { relativeTime } from '$lib/format/relative-time'
	import { notificationTarget } from '$lib/notifications/notification-target'
	import Avatar from '../ui/Avatar.svelte'
	let { notification, now }: { notification: Notification; now: Date } = $props()
	const name = $derived(notification.actor?.displayName ?? $_('notifications.someone'))
	const target = $derived(notificationTarget(notification))
</script>

<li data-notification-id={notification.id} data-unread={notification.readAt === null}>
	<form method="POST" action="/notifications?/read" use:enhance>
		<input type="hidden" name="id" value={notification.id} />
		<button
			type="submit"
			class="flex min-h-11 w-full cursor-pointer items-start gap-3 px-3 py-4 text-left hover:bg-elevated {notification.readAt ===
			null
				? 'bg-primary-soft'
				: 'bg-surface'}"
		>
			<Avatar
				user={notification.actor ?? { id: '', username: '', displayName: name, avatarUrl: null }}
			/>
			<span class="min-w-0 flex-1">
				<span
					class="block break-words text-body {notification.readAt === null ? 'font-semibold' : ''}"
				>
					{$_(`notifications.activity.${notification.type}`, { values: { name } })}
				</span>
				<time datetime={notification.createdAt} class="mt-1 block text-meta text-fg-muted">
					{relativeTime(notification.createdAt, now, $locale ?? 'en')}
				</time>
				{#if !target}<span class="mt-1 block text-meta text-fg-muted"
						>{$_('notifications.unavailable')}</span
					>{/if}
			</span>
			{#if notification.readAt === null}
				<span
					class="mt-2 size-2 shrink-0 rounded-full bg-primary"
					aria-label={$_('notifications.unread')}
				></span>
			{/if}
		</button>
	</form>
</li>

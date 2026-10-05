<script lang="ts">
	import { _ } from 'svelte-i18n'
	let { count }: { count: number | null } = $props()
</script>

{#if count !== null && count > 0}
	<span
		class="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-nav font-semibold text-on-primary"
		aria-label={$_('notifications.unreadCount', { values: { count } })}
		data-unread-count={count}>{count > 99 ? $_('notifications.badgeOverflow') : count}</span
	>
{/if}

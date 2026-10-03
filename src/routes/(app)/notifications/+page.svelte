<script lang="ts">
	import { _ } from 'svelte-i18n'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
</script>

<svelte:head><title>{$_('notifications.title')} · {$_('app.name')}</title></svelte:head>
<h1 class="py-4 text-title font-semibold">{$_('notifications.title')}</h1>
<EmptyState title={$_('notifications.empty')} />

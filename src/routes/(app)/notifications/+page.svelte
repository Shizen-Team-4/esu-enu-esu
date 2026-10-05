<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import NotificationList from '$lib/components/notifications/NotificationList.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	let { data, form } = $props()
</script>

<svelte:head><title>{$_('notifications.title')} · {$_('app.name')}</title></svelte:head>
<section class="py-4">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-title font-semibold">{$_('notifications.title')}</h1>
		<form method="POST" action="?/readAll" use:enhance>
			<Button type="submit" variant="ghost">{$_('notifications.markAllRead')}</Button>
		</form>
	</div>
	{#if form?.error}<p role="alert" class="mb-4 text-body">
			{$_(errorMessageKey(form.error.code))}
		</p>{/if}
	<NotificationList initial={data.initial} cursor={data.cursor} errorCode={data.errorCode} />
</section>

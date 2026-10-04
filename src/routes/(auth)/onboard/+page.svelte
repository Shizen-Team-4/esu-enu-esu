<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import { enhance } from '$app/forms'
	import { errorMessageKey } from '$lib/errors/error-message'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	import TextField from '$lib/components/ui/TextField.svelte'
	let { form } = $props()
</script>

<svelte:head><title>{$_('onboard.title')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('onboard.title')} subtitle={$_('onboard.description')} />
<form method="POST" use:enhance class="grid gap-4">
	<TextField
		id="onboard-username"
		name="username"
		label={$_('auth.username')}
		prefix="@"
		hint={$_('auth.usernameHint')}
		autocomplete="username"
		autocapitalize="none"
		required
		error={form?.error?.fields?.username}
	/>
	{#if form?.error?.code && !form.error.fields?.username}
		<p role="alert">{$_(errorMessageKey(form.error.code))}</p>
	{/if}
	<Button type="submit" variant="primary" class="w-full">{$_('onboard.submit')}</Button>
</form>

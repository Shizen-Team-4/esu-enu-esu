<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import TextField from '$lib/components/ui/TextField.svelte'
	import { submitAuth } from '$lib/auth/submit-auth'
	import { errorMessageKey } from '$lib/errors/error-message'

	let { email }: { email: string } = $props()
	let typedEmail = $state('')
	let pending = $state(false)
	let sent = $state(false)
	let errorCode = $state<string | null>(null)
	const target = $derived(email || typedEmail)

	async function resend() {
		pending = true
		const response = await submitAuth(
			'resend-verification',
			{ email: target },
			window.location.origin,
		)
		pending = false
		sent = response.ok
		errorCode = response.ok ? null : response.code
	}
</script>

<div class="grid gap-3">
	{#if !email}
		<TextField
			id="resend-email"
			name="email"
			type="email"
			label={$_('auth.email')}
			autocomplete="email"
			bind:value={typedEmail}
		/>
	{/if}
	<Button type="button" disabled={pending || !target} onclick={resend}
		>{$_('auth.resendVerification')}</Button
	>
	{#if sent}<p role="status">{$_('auth.verificationSent')}</p>{/if}
	{#if errorCode}<p role="alert">{$_(errorMessageKey(errorCode))}</p>{/if}
</div>

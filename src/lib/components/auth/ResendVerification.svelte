<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import { submitAuth } from '$lib/auth/submit-auth'
	import { errorMessageKey } from '$lib/errors/error-message'

	let { email }: { email: string } = $props()
	let pending = $state(false)
	let sent = $state(false)
	let errorCode = $state<string | null>(null)

	async function resend() {
		pending = true
		const response = await submitAuth('resend-verification', { email }, window.location.origin)
		pending = false
		sent = response.ok
		errorCode = response.ok ? null : response.code
	}
</script>

<div class="grid gap-3">
	<Button type="button" disabled={pending} onclick={resend}>{$_('auth.resendVerification')}</Button>
	{#if sent}<p role="status">{$_('auth.verificationSent')}</p>{/if}
	{#if errorCode}<p role="alert">{$_(errorMessageKey(errorCode))}</p>{/if}
</div>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { submitAuth, type AuthOperation } from '$lib/auth/submit-auth'
	import { errorMessageKey } from '$lib/errors/error-message'
	import AuthFields from './auth/AuthFields.svelte'
	let { operation, token = '' }: { operation: AuthOperation; token?: string } = $props()
	let pending = $state(false)
	let success = $state(false)
	let errorCode = $state<string | null>(null)
	let fields = $state<Record<string, string>>({})
	async function submit(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		const data = new FormData(event.currentTarget as HTMLFormElement)
		const input = Object.fromEntries(
			[...data.entries()].map(([key, value]) => [key, String(value)]),
		)
		const response = await submitAuth(operation, { ...input, token }, window.location.origin)
		pending = false
		success = response.ok
		errorCode = response.ok ? null : response.code
		fields = response.ok ? {} : (response.fields ?? {})
		if (response.ok && operation === 'login') await goto('/', { invalidateAll: true })
	}
</script>

<form onsubmit={submit} class="grid gap-4">
	<AuthFields {operation} {fields} />
	<Button type="submit" variant="primary" class="w-full" disabled={pending}
		>{$_(
			`auth.${operation === 'request-reset' || operation === 'reset' ? 'reset' : operation}`,
		)}</Button
	>
	{#if success}<p role="status">{$_('auth.success')}</p>{/if}
	{#if errorCode}<p role="alert">{$_(errorMessageKey(errorCode))}</p>{/if}
</form>

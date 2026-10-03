<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { submitAuth, type AuthOperation } from '$lib/auth/submit-auth'
	let { operation, token = '' }: { operation: AuthOperation; token?: string } = $props()
	let pending = $state(false)
	let result = $state('')
	async function submit(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		const data = new FormData(event.currentTarget as HTMLFormElement)
		const input = Object.fromEntries(
			[...data.entries()].map(([key, value]) => [key, String(value)]),
		)
		const response = await submitAuth(operation, { ...input, token }, window.location.origin)
		pending = false
		result = response.ok
			? 'success'
			: response.code === 'EMAIL_NOT_VERIFIED'
				? 'unverified'
				: 'error'
		if (response.ok && operation === 'login') await goto('/dashboard', { invalidateAll: true })
	}
</script>

<form onsubmit={submit}>
	{#if operation === 'register'}
		<label>{$_('auth.name')}<input name="name" autocomplete="name" required maxlength="50" /></label
		>
		<label
			>{$_('auth.username')}<input
				name="username"
				autocomplete="username"
				required
				pattern={'[a-z0-9_]{3,30}'}
			/></label
		>
	{/if}
	{#if operation !== 'reset'}<label
			>{$_('auth.email')}<input name="email" type="email" autocomplete="email" required /></label
		>{/if}
	{#if operation !== 'request-reset'}<label
			>{$_('auth.password')}<input
				name="password"
				type="password"
				autocomplete={operation === 'login' ? 'current-password' : 'new-password'}
				required
				minlength="8"
				maxlength="128"
			/></label
		>{/if}
	<button disabled={pending}
		>{$_(
			`auth.${operation === 'request-reset' || operation === 'reset' ? 'reset' : operation}`,
		)}</button
	>
	{#if result}<p role="status">{$_(`auth.${result}`)}</p>{/if}
</form>

<style>
	form,
	label {
		display: grid;
		gap: 0.5rem;
	}
	form {
		gap: 1rem;
	}
	input {
		min-width: 0;
		width: 100%;
		padding: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
</style>

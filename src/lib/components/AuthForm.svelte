<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { submitAuth, type AuthOperation } from '$lib/auth/submit-auth'
	import { errorMessageKey } from '$lib/errors/error-message'
	import FieldError from './FieldError.svelte'
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
		if (response.ok && operation === 'login') await goto('/dashboard', { invalidateAll: true })
	}
	const invalid = (name: string) => (fields[name] ? 'true' : undefined)
	const describedBy = (name: string) => (fields[name] ? `auth-${name}-error` : undefined)
</script>

<form onsubmit={submit}>
	{#if operation === 'register'}
		<label
			>{$_('auth.name')}<input
				name="name"
				autocomplete="name"
				required
				maxlength="50"
				aria-invalid={invalid('name')}
				aria-describedby={describedBy('name')}
			/><FieldError code={fields.name} id="auth-name-error" /></label
		>
		<label
			>{$_('auth.username')}<input
				name="username"
				autocomplete="username"
				required
				pattern={'[a-z0-9_]{3,30}'}
				aria-invalid={invalid('username')}
				aria-describedby={describedBy('username')}
			/><FieldError code={fields.username} id="auth-username-error" /></label
		>
	{/if}
	{#if operation !== 'reset'}<label
			>{$_('auth.email')}<input
				name="email"
				type="email"
				autocomplete="email"
				required
				aria-invalid={invalid('email')}
				aria-describedby={describedBy('email')}
			/><FieldError code={fields.email} id="auth-email-error" /></label
		>{/if}
	{#if operation !== 'request-reset'}<label
			>{$_('auth.password')}<input
				name="password"
				type="password"
				autocomplete={operation === 'login' ? 'current-password' : 'new-password'}
				required
				minlength="8"
				maxlength="128"
				aria-invalid={invalid('password')}
				aria-describedby={describedBy('password')}
			/><FieldError code={fields.password} id="auth-password-error" /></label
		>{/if}
	<button disabled={pending}
		>{$_(
			`auth.${operation === 'request-reset' || operation === 'reset' ? 'reset' : operation}`,
		)}</button
	>
	{#if success}<p role="status">{$_('auth.success')}</p>{/if}
	{#if errorCode}<p role="alert">{$_(errorMessageKey(errorCode))}</p>{/if}
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

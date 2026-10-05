<script lang="ts">
	import { _ } from 'svelte-i18n'
	import TextField from '$lib/components/ui/TextField.svelte'
	import PasswordField from '$lib/components/ui/PasswordField.svelte'
	import type { AuthOperation } from '$lib/auth/submit-auth'
	import type { FieldErrorCode } from '$lib/types/error'

	let { operation, fields }: { operation: AuthOperation; fields: Record<string, string> } = $props()
</script>

{#if operation === 'register'}
	<TextField
		id="auth-name"
		name="name"
		label={$_('auth.name')}
		autocomplete="name"
		required
		maxlength={50}
		error={fields.name as FieldErrorCode | undefined}
	/>
	<TextField
		id="auth-username"
		name="username"
		label={$_('auth.username')}
		prefix="@"
		hint={$_('auth.usernameHint')}
		autocomplete="username"
		autocapitalize="none"
		required
		pattern={'[a-z0-9_]{3,30}'}
		error={fields.username as FieldErrorCode | undefined}
	/>
{/if}
{#if operation !== 'reset'}
	<TextField
		id="auth-email"
		name="email"
		type="email"
		label={$_('auth.email')}
		autocomplete="email"
		required
		error={fields.email as FieldErrorCode | undefined}
	/>
{/if}
{#if operation !== 'request-reset'}
	<PasswordField
		id="auth-password"
		name="password"
		label={$_('auth.password')}
		autocomplete={operation === 'login' ? 'current-password' : 'new-password'}
		required
		minlength={8}
		maxlength={128}
		error={fields.password as FieldErrorCode | undefined}
	>
		{#snippet aside()}
			{#if operation === 'login'}<a href="/forgot-password">{$_('auth.forgotPassword')}</a>{/if}
		{/snippet}
	</PasswordField>
{/if}

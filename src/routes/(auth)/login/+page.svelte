<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { page } from '$app/state'
	import { googleSignInErrorKey } from '$lib/auth/google-sign-in-error'
	import { verifyLinkErrorKey } from '$lib/auth/verify-link-error'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	import AuthTabs from '$lib/components/auth/AuthTabs.svelte'
	import GoogleSignIn from '$lib/components/auth/GoogleSignIn.svelte'
	const error = $derived(page.url.searchParams.get('error'))
	const errorKey = $derived(verifyLinkErrorKey(error) ?? googleSignInErrorKey(error))
</script>

<svelte:head><title>{$_('auth.login')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.loginTitle')} subtitle={$_('auth.loginSubtitle')} />
<AuthTabs />
{#if errorKey}
	<p role="alert">{$_(errorKey)}</p>
{/if}
<AuthForm operation="login" />
<GoogleSignIn />

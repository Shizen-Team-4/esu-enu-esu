<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { page } from '$app/state'
	import { verifyLinkErrorKey } from '$lib/auth/verify-link-error'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	import AuthTabs from '$lib/components/auth/AuthTabs.svelte'
	import GoogleSignIn from '$lib/components/auth/GoogleSignIn.svelte'
	const linkErrorKey = $derived(verifyLinkErrorKey(page.url.searchParams.get('error')))
</script>

<svelte:head><title>{$_('auth.login')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.loginTitle')} subtitle={$_('auth.loginSubtitle')} />
<AuthTabs />
{#if linkErrorKey}
	<p role="alert">{$_(linkErrorKey)}</p>
{/if}
<AuthForm operation="login" />
<GoogleSignIn />

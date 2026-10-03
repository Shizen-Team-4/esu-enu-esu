<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	import AuthTabs from '$lib/components/auth/AuthTabs.svelte'
	import GoogleSignIn from '$lib/components/auth/GoogleSignIn.svelte'
</script>

<svelte:head><title>{$_('auth.login')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.loginTitle')} subtitle={$_('auth.loginSubtitle')} />
<AuthTabs />
<AuthForm operation="login" />
<GoogleSignIn />

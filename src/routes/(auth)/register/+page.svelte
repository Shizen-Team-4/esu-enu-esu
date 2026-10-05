<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	import AuthTabs from '$lib/components/auth/AuthTabs.svelte'
	import GoogleSignIn from '$lib/components/auth/GoogleSignIn.svelte'
</script>

<svelte:head><title>{$_('auth.register')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.registerTitle')} subtitle={$_('auth.registerSubtitle')} />
<AuthTabs />
<AuthForm operation="register" />
<GoogleSignIn />

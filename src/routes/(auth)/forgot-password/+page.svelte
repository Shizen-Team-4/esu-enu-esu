<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
</script>

<svelte:head><title>{$_('auth.reset')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.reset')} subtitle={$_('auth.forgotSubtitle')} />
<AuthForm operation="request-reset" />
<a href="/login" class="text-meta">{$_('auth.backToSignIn')}</a>

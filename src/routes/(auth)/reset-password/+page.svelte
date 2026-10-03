<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import AuthHeading from '$lib/components/auth/AuthHeading.svelte'
	let { data } = $props()
</script>

<svelte:head><title>{$_('auth.reset')} · {$_('app.name')}</title></svelte:head>

<AuthHeading title={$_('auth.reset')} subtitle={$_('auth.resetSubtitle')} />
<AuthForm operation="reset" token={data.token} />
<a href="/login" class="text-meta">{$_('auth.backToSignIn')}</a>

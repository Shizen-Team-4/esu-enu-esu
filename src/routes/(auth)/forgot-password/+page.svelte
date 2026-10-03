<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import { _ } from 'svelte-i18n'
</script>

<svelte:head><title>{$_('auth.reset')} · {$_('app.name')}</title></svelte:head>

<section class="panel grid gap-4">
	<h1 class="text-title font-semibold">{$_('auth.reset')}</h1>
	<AuthForm operation="request-reset" /><Button href="/login">{$_('auth.login')}</Button>
</section>

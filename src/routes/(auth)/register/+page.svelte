<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import { _ } from 'svelte-i18n'
</script>

<svelte:head><title>{$_('auth.register')} · {$_('app.name')}</title></svelte:head>

<section class="panel grid gap-4">
	<h1 class="text-title font-semibold">{$_('auth.register')}</h1>
	<AuthForm operation="register" /><Button href="/login">{$_('auth.login')}</Button>
</section>

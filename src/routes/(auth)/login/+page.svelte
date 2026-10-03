<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import GoogleLogo from '$lib/components/GoogleLogo.svelte'
</script>

<svelte:head><title>{$_('auth.login')} · {$_('app.name')}</title></svelte:head>

<section class="panel grid gap-4">
	<h1 class="text-title font-semibold">{$_('auth.login')}</h1>
	<AuthForm operation="login" />
	<nav>
		<Button href="/register">{$_('auth.register')}</Button><Button href="/forgot-password"
			>{$_('auth.reset')}</Button
		>
	</nav>
	<form method="POST" action="/auth/google">
		<Button type="submit" class="w-full gap-3"
			><span class="google-logo"><GoogleLogo /></span>{$_('auth.google')}</Button
		>
	</form>
</section>

<style>
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-block: 1rem;
	}
	.google-logo {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #ffffff;
	}
</style>

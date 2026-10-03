<script lang="ts">
	import { _ } from 'svelte-i18n'
	import AuthForm from '$lib/components/AuthForm.svelte'
	import GoogleLogo from '$lib/components/GoogleLogo.svelte'
</script>

<main class="container">
	<section class="panel">
		<a class="button" href="/">SNS</a>
		<h1>{$_('auth.login')}</h1>
		<AuthForm operation="login" />
		<nav>
			<a class="button" href="/register">{$_('auth.register')}</a><a
				class="button"
				href="/forgot-password">{$_('auth.reset')}</a
			>
		</nav>
		<form method="POST" action="/auth/google">
			<button type="submit" class="google-button gap-3"
				><span class="google-logo"><GoogleLogo /></span>{$_('auth.google')}</button
			>
		</form>
	</section>
</main>

<style>
	main {
		padding-block: clamp(2rem, 8vw, 6rem);
	}
	section {
		max-width: 32rem;
		margin-inline: auto;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-block: 1rem;
	}
	.google-button {
		width: 100%;
		background: var(--elevated);
		color: var(--fg);
		border: 1px solid var(--line);
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

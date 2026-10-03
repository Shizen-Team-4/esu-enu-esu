<script lang="ts">
	import AuthForm from '$lib/components/AuthForm.svelte'
	import { _ } from 'svelte-i18n'
</script>

<main class="container panel">
	<h1>{$_('auth.register')}</h1>
	<AuthForm operation="register" /><a class="button" href="/login">{$_('auth.login')}</a>
</main>

<style>
	main {
		max-width: 32rem;
		margin-block: 2rem;
	}
</style>

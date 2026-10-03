<script lang="ts">
	import AuthForm from '$lib/components/AuthForm.svelte'
	import { _ } from 'svelte-i18n'
	let { data } = $props()
</script>

<main class="container panel">
	<h1>{$_('auth.reset')}</h1>
	<AuthForm operation="reset" token={data.token} /><a class="button" href="/login"
		>{$_('auth.login')}</a
	>
</main>

<style>
	main {
		max-width: 32rem;
		margin-block: 2rem;
	}
</style>

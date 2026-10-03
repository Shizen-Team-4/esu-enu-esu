<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { enhance } from '$app/forms'
	import { errorMessageKey } from '$lib/errors/error-message'
	import FieldError from '$lib/components/FieldError.svelte'
	let { form } = $props()
</script>

<main class="container">
	<section class="panel">
		<h1>{$_('onboard.title')}</h1>
		<p>{$_('onboard.description')}</p>
		<form method="POST" use:enhance>
			<label for="onboard-username">{$_('auth.username')}</label>
			<input
				id="onboard-username"
				name="username"
				autocomplete="username"
				autocapitalize="none"
				required
				aria-describedby={form?.error?.fields?.username ? 'onboard-username-error' : undefined}
			/>
			<FieldError code={form?.error?.fields?.username} id="onboard-username-error" />
			{#if form?.error?.code && !form.error.fields?.username}
				<p role="alert">{$_(errorMessageKey(form.error.code))}</p>
			{/if}
			<button type="submit">{$_('onboard.submit')}</button>
		</form>
	</section>
</main>

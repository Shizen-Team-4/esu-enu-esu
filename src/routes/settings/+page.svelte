<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import FieldError from '$lib/components/FieldError.svelte'
	import { enhance } from '$app/forms'
	let { data, form } = $props()
</script>

<main class="container py-8" style="max-width: 630px">
	<h1 class="mb-6 text-3xl font-semibold">{$_('preferences.title')}</h1>
	<form method="POST" use:enhance class="panel grid gap-8">
		<fieldset>
			<legend class="mb-3 text-lg font-semibold">{$_('preferences.theme')}</legend>
			<div class="grid grid-cols-3 gap-2">
				{#each ['system', 'light', 'dark'] as theme}<label
						class="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-line bg-elevated p-2"
						><input
							type="radio"
							name="theme"
							value={theme}
							checked={data.preferences.theme === theme}
							aria-describedby={form?.error?.fields?.theme ? 'settings-theme-error' : undefined}
							class="min-h-0 accent-primary"
						/><span>{$_(`preferences.${theme}`)}</span></label
					>{/each}
			</div>
			<FieldError code={form?.error?.fields?.theme} id="settings-theme-error" />
		</fieldset>
		<fieldset>
			<legend class="mb-3 text-lg font-semibold">{$_('preferences.language')}</legend>
			<div class="grid gap-2">
				{#each ['en', 'km', 'ja'] as language}<label
						class="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line bg-elevated p-3"
						><input
							type="radio"
							name="language"
							value={language}
							checked={data.preferences.language === language}
							aria-describedby={form?.error?.fields?.language
								? 'settings-language-error'
								: undefined}
							class="min-h-0 accent-primary"
						/><span>{$_(`preferences.${language}`)}</span></label
					>{/each}
			</div>
			<FieldError code={form?.error?.fields?.language} id="settings-language-error" />
		</fieldset>
		{#if form?.error?.code}<p role="alert">{$_(errorMessageKey(form.error.code))}</p>{/if}
		<button type="submit">{$_('preferences.save')}</button>
	</form>
</main>

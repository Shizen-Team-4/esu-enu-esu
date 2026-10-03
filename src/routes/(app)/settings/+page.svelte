<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import FieldError from '$lib/components/FieldError.svelte'
	import { enhance } from '$app/forms'
	let { data, form } = $props()
</script>

<svelte:head><title>{$_('preferences.title')} · {$_('app.name')}</title></svelte:head>
<div class="py-4">
	<h1 class="mb-6 text-title font-semibold">{$_('preferences.title')}</h1>
	<form method="POST" action="?/preferences" use:enhance class="panel grid gap-8">
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
		<Button type="submit" variant="primary">{$_('preferences.save')}</Button>
	</form>
	{#if data.signedIn}
		<a href="/settings/profile" class="mt-8 inline-block text-body text-primary"
			>{$_('profile.editProfile')}</a
		>
	{/if}
</div>

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import FieldError from '$lib/components/FieldError.svelte'
	import { enhance } from '$app/forms'
	let { data, form } = $props()
	const profileFields = $derived(form?.error?.fields)
</script>

<main class="container py-8" style="max-width: 630px">
	<h1 class="mb-6 text-3xl font-semibold">{$_('preferences.title')}</h1>
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
		<button type="submit">{$_('preferences.save')}</button>
	</form>
	{#if data.profile}
		<form method="POST" action="?/profile" use:enhance class="panel mt-8 grid gap-4">
			<h2 class="text-lg font-semibold">{$_('account.title')}</h2>
			<label for="settings-username">{$_('auth.username')}</label>
			<input
				id="settings-username"
				name="username"
				value={data.profile.username}
				autocapitalize="none"
				aria-describedby={profileFields?.username ? 'settings-username-error' : undefined}
			/>
			<FieldError code={profileFields?.username} id="settings-username-error" />
			<label for="settings-display-name">{$_('auth.name')}</label>
			<input
				id="settings-display-name"
				name="displayName"
				value={data.profile.displayName}
				aria-describedby={profileFields?.displayName ? 'settings-display-name-error' : undefined}
			/>
			<FieldError code={profileFields?.displayName} id="settings-display-name-error" />
			<label for="settings-bio">{$_('account.bio')}</label>
			<textarea
				id="settings-bio"
				name="bio"
				rows="3"
				aria-describedby={profileFields?.bio ? 'settings-bio-error' : undefined}
				>{data.profile.bio}</textarea
			>
			<FieldError code={profileFields?.bio} id="settings-bio-error" />
			<label class="flex items-center gap-2"
				><input type="checkbox" name="removeAvatar" class="min-h-0 accent-primary" /><span
					>{$_('account.removeAvatar')}</span
				></label
			>
			<FieldError code={profileFields?.avatarMediaId} id="settings-avatar-error" />
			<button type="submit">{$_('account.save')}</button>
		</form>
	{/if}
</main>

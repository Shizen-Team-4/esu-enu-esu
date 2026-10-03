<script lang="ts">
	import { onDestroy } from 'svelte'
	import { _ } from 'svelte-i18n'
	import { enhance } from '$app/forms'
	import PageBar from '$lib/components/ui/PageBar.svelte'
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
	import FieldError from '$lib/components/FieldError.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { SUPPORTED_LANGS } from '$lib/i18n/config'

	const FLASH_MS = 2000
	const themeIcons: Record<string, string> = {
		system: 'M3 5h18v11H3zM8 20h8M12 16v4',
		light:
			'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
		dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
	}
	const themes = ['system', 'light', 'dark']

	let { data, form } = $props()
	let formEl: HTMLFormElement
	// svelte-ignore state_referenced_locally
	let theme = $state(data.preferences.theme)
	// svelte-ignore state_referenced_locally
	let language = $state(data.preferences.language)
	let saved = $state(false)
	let timer: ReturnType<typeof setTimeout> | undefined

	const themeOptions = $derived(
		themes.map((value) => ({ value, label: $_(`preferences.${value}`), icon: themeIcons[value] })),
	)

	function flashSaved() {
		saved = true
		clearTimeout(timer)
		timer = setTimeout(() => (saved = false), FLASH_MS)
	}

	onDestroy(() => clearTimeout(timer))
</script>

<svelte:head><title>{$_('preferences.title')} · {$_('app.name')}</title></svelte:head>
<PageBar title={$_('preferences.title')} backHref="/" />
<div class="mx-auto my-7 w-full max-w-[520px] px-gutter">
	<form
		bind:this={formEl}
		method="POST"
		action="?/preferences"
		use:enhance={() => {
			saved = false
			return async ({ result, update }) => {
				await update({ reset: false, invalidateAll: true })
				if (result.type === 'success') flashSaved()
			}
		}}
		class="border border-line bg-surface"
	>
		<div class="flex justify-between gap-4 px-4 py-3.5 max-[480px]:flex-col">
			<div>
				<p class="font-semibold">{$_('preferences.theme')}</p>
				<p class="text-meta text-fg-muted">{$_('preferences.themeHint')}</p>
			</div>
			<SegmentedControl
				name="theme"
				label={$_('preferences.theme')}
				options={themeOptions}
				bind:value={theme}
				onchange={() => formEl.requestSubmit()}
			/>
		</div>
		<div class="flex justify-between gap-4 border-t border-line px-4 py-3.5 max-[480px]:flex-col">
			<div>
				<label for="settings-language" class="font-semibold">{$_('preferences.language')}</label>
				<p class="text-meta text-fg-muted">{$_('preferences.languageHint')}</p>
			</div>
			<select
				id="settings-language"
				name="language"
				bind:value={language}
				onchange={() => formEl.requestSubmit()}
				aria-describedby={form?.error?.fields?.language ? 'settings-language-error' : undefined}
				class="field min-h-11 min-w-[140px] px-3"
			>
				{#each SUPPORTED_LANGS as lang (lang)}
					<option value={lang}>{$_(`preferences.${lang}`)}</option>
				{/each}
			</select>
		</div>
		{#if data.signedIn}
			<a
				href="/settings/profile"
				class="flex items-center justify-between gap-4 border-t border-line px-4 py-3.5 text-fg no-underline"
			>
				<span class="font-semibold">{$_('profile.editProfile')}</span>
				<svg
					viewBox="0 0 24 24"
					class="size-5 text-fg-muted"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg
				>
			</a>
		{/if}
	</form>
	<FieldError code={form?.error?.fields?.theme} id="settings-theme-error" />
	<FieldError code={form?.error?.fields?.language} id="settings-language-error" />
	<p aria-live="polite" class="mt-2 min-h-5 text-right text-meta text-fg-muted">
		{#if form?.error?.code}
			<span class="text-danger">{$_(errorMessageKey(form.error.code))}</span>
		{:else if saved}
			{$_('preferences.saved')}
		{/if}
	</p>
</div>

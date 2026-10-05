<script lang="ts">
	import { page } from '$app/state'
	import { _ } from 'svelte-i18n'
	import { enhance } from '$app/forms'
	import Button from '$lib/components/ui/Button.svelte'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import NavIcon from '$lib/components/NavIcon.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	let { data, form } = $props()
	const composing = $derived(page.url.searchParams.has('compose') || Boolean(data.q))
</script>

<svelte:head><title>{$_('nav.messages')} · {$_('app.name')}</title></svelte:head>
{#if composing}
	<div class="message-search">
		<header class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-semibold">{$_('messages.new')}</h2>
			<a
				href="/messages"
				class="grid size-11 place-items-center text-fg"
				aria-label={$_('common.close')}><NavIcon path="m6 6 12 12 M6 18 18 6" /></a
			>
		</header>
		<form method="GET" action="/messages" class="flex gap-2">
			<input type="hidden" name="compose" value="1" /><input
				name="q"
				value={data.q}
				aria-label={$_('messages.search')}
				placeholder={$_('messages.search')}
				maxlength="50"
				class="field min-w-0 flex-1 px-4"
			/><Button type="submit">{$_('nav.search')}</Button>
		</form>
		{#if form?.error}<p role="alert" class="py-3 text-sm">
				{$_(errorMessageKey(form.error.code))}
			</p>{/if}
		<div class="mt-5 grid gap-2">
			{#each data.results?.items ?? [] as person (person.id)}
				{#if person.id !== data.me?.id}<form method="POST" action="?/start" use:enhance>
						<input type="hidden" name="recipientId" value={person.id} /><button
							type="submit"
							class="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-xl p-3 text-left hover:bg-elevated"
							><Avatar user={person} /><span class="grid"
								><strong class="text-sm">{person.username}</strong><span
									class="text-sm text-fg-muted">{person.displayName}</span
								></span
							></button
						>
					</form>{/if}
			{/each}
			{#if data.results && !data.results.items.some((person) => person.id !== data.me?.id)}<p
					class="py-8 text-center text-fg-muted"
				>
					{$_('messages.noPeople')}
				</p>{/if}
		</div>
	</div>
{:else}
	<div class="message-empty">
		<div class="mb-5 grid size-24 place-items-center rounded-full border-2 border-fg">
			<NavIcon path="m22 2-7 20-4-9-9-4 20-7z M22 2 11 13" size={44} />
		</div>
		<h2 class="mb-2 text-xl">{$_('messages.yourMessages')}</h2>
		<p class="mb-6 max-w-xs text-center text-sm text-fg-muted">{$_('messages.intro')}</p>
		<Button href="/messages?compose=1" variant="primary">{$_('messages.new')}</Button>
	</div>
{/if}

<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { ErrorEnvelope, FollowListItem, Page } from '$lib/contract'
	import type { FollowListKind } from '$lib/follows/fetch-follows'
	import { errorMessageKey } from '$lib/errors/error-message'
	import PageBar from '../ui/PageBar.svelte'
	import FollowList from './FollowList.svelte'

	let {
		username,
		kind,
		initial,
		form,
	}: {
		username: string
		kind: FollowListKind
		initial: Page<FollowListItem>
		form: { error?: ErrorEnvelope['error'] } | null
	} = $props()
</script>

<svelte:head><title>{$_(`profile.${kind}`)} · @{username} · {$_('app.name')}</title></svelte:head>
<PageBar title={$_('common.back')} backHref="/u/{username}" />
<section class="py-6">
	<h1 class="m-0 text-title font-semibold">{$_(`profile.${kind}`)}</h1>
	<p class="mb-6 mt-1 text-meta text-fg-muted">@{username}</p>
	{#if form?.error}<p role="alert">{$_(errorMessageKey(form.error.code))}</p>{/if}
	{#key `${username}/${kind}`}<FollowList {initial} {username} {kind} />{/key}
</section>

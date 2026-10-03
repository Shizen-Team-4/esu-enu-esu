<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { enhance } from '$app/forms'
	import StorySeenForm from '$lib/components/StorySeenForm.svelte'
	let { data, form } = $props()
	let index = $state(0)
	let current = $derived(data.items[index])
	let expired = $state(false)
	$effect(() => {
		if (!current) return
		expired = Date.parse(current.expiresAt) <= Date.now()
		const timeout = setTimeout(
			() => {
				expired = true
			},
			Math.max(0, Date.parse(current.expiresAt) - Date.now()),
		)
		return () => clearTimeout(timeout)
	})
</script>

<main class="container py-6" style="max-width: 630px">
	<a class="button" href="/dashboard">{$_('story.close')}</a>
	{#if form?.error?.code}<p role="alert">{$_(errorMessageKey(form.error.code))}</p>{/if}
	{#if current && !expired}
		{#key current.id}<StorySeenForm id={current.id} pending={!current.viewer.seen} />{/key}
		<header class="my-4 flex items-center justify-between">
			<strong>@{current.author.username || current.author.displayName}</strong><span
				class="text-fg-muted">{index + 1} / {data.items.length}</span
			>
		</header>
		{#if current.media.type === 'image'}<img
				src={current.media.url}
				width={current.media.width}
				height={current.media.height}
				alt=""
				class="max-h-[70dvh] w-full rounded-card object-contain"
			/>{:else}<video
				src={current.media.url}
				poster={current.media.thumbnailUrl ?? undefined}
				width={current.media.width}
				height={current.media.height}
				controls
				class="max-h-[70dvh] w-full rounded-card object-contain"><track kind="captions" /></video
			>{/if}
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<button
				disabled={index === 0}
				onclick={() => {
					index--
				}}>{$_('story.previous')}</button
			>
			<button
				disabled={index + 1 >= data.items.length}
				onclick={() => {
					index++
				}}>{$_('story.next')}</button
			>
			<form method="POST" action="?/love" use:enhance>
				<input type="hidden" name="id" value={current.id} /><input
					type="hidden"
					name="active"
					value={String(!current.viewer.liked)}
				/><button aria-label={$_('story.love')} aria-pressed={current.viewer.liked} class="gap-2"
					><svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill={current.viewer.liked ? 'currentColor' : 'none'}
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
						><path
							d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
						/></svg
					>{current.likes}</button
				>
			</form>
			{#if current.author.id === data.viewerId}<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={current.id} /><button>{$_('post.delete')}</button>
				</form>{/if}
		</div>
	{:else}<p class="my-8">{$_('story.expired')}</p>{/if}
</main>

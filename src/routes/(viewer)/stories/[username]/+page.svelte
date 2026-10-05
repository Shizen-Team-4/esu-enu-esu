<script lang="ts">
	import { _ } from 'svelte-i18n'
	import StoryPlayer from '$lib/components/story/StoryPlayer.svelte'
	let { data, form } = $props()
	// svelte-ignore state_referenced_locally
	let index = $state(data.latest ? Math.max(0, data.items.length - 1) : 0)
	// svelte-ignore state_referenced_locally
	let finished = $state(data.items.length === 0)
	let current = $derived(data.items[index])
	function next() {
		if (index + 1 < data.items.length) index += 1
		else finished = true
	}
	function previous() {
		if (finished) finished = false
		else if (index > 0) index -= 1
	}
</script>

<svelte:head><title>{$_('story.title')} · {$_('app.name')}</title></svelte:head>
<main class="story-viewer">
	<a class="story-viewer-brand" href="/" aria-label={$_('app.name')}>
		<img src="/sns-logo-monochrome.png" alt={$_('app.name')} />
	</a>
	<a class="story-viewer-close" href="/" aria-label={$_('story.close')}>×</a>
	{#if form?.error?.code}<p class="story-viewer-error" role="alert">{$_('story.viewError')}</p>{/if}
	{#if !finished && current}
		{#key current.id}
			<StoryPlayer
				story={current}
				{index}
				count={data.items.length}
				viewerId={data.viewerId}
				{next}
				{previous}
			/>
		{/key}
	{:else}
		<div class="story-finished">
			<div class="story-finished-icon" aria-hidden="true">✓</div>
			<h1>{$_('story.finished')}</h1>
			<p>{$_('story.finishedHint')}</p>
			<div class="flex flex-wrap justify-center gap-3">
				<a href="/" class="story-finished-action">{$_('story.backHome')}</a>
				{#if data.items.length}<button type="button" onclick={previous}
						>{$_('story.previous')}</button
					>{/if}
			</div>
		</div>
	{/if}
</main>

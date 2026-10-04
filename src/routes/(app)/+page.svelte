<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { _ } from 'svelte-i18n'
	import FeedList from '$lib/components/feed/FeedList.svelte'
	import FeedTabs from '$lib/components/feed/FeedTabs.svelte'
	import StoryTray from '$lib/components/StoryTray.svelte'
	import ErrorState from '$lib/components/ui/ErrorState.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'

	let { data } = $props()
</script>

<svelte:head><title>{$_('app.name')}</title></svelte:head>

<div class="pt-3">
	<h1 class="sr-only">{$_('nav.home')}</h1>
	<section
		aria-labelledby="story-circle"
		class="grid gap-3 px-gutter py-3 max-md:border max-md:border-line max-md:bg-surface"
	>
		<h2 id="story-circle" class="text-meta font-semibold text-fg">{$_('story.circle')}</h2>
		<StoryTray items={data.stories.items} me={data.me} />
	</section>
	<div class="mt-3"><FeedTabs scope={data.scope} /></div>
	{#if data.feed}
		<FeedList initial={data.feed} scope={data.scope} />
	{:else}
		<ErrorState
			message={$_(errorMessageKey(data.feedError))}
			onretry={() => void invalidateAll()}
		/>
	{/if}
</div>

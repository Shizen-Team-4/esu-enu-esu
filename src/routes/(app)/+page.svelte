<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { _ } from 'svelte-i18n'
	import FeedList from '$lib/components/feed/FeedList.svelte'
	import FeedTabs from '$lib/components/feed/FeedTabs.svelte'
	import StoryTray from '$lib/components/StoryTray.svelte'
	import ErrorState from '$lib/components/ui/ErrorState.svelte'

	let { data } = $props()
</script>

<svelte:head><title>{$_('app.name')}</title></svelte:head>

<div class="home-feed">
	<h1 class="sr-only">{$_('nav.home')}</h1>
	<section aria-labelledby="story-circle" class="py-4">
		<h2 id="story-circle" class="sr-only">{$_('story.circle')}</h2>
		<StoryTray items={data.stories.items} me={data.me} />
	</section>
	<div class="mb-3"><FeedTabs scope={data.scope} /></div>
	{#if data.feed}
		<FeedList initial={data.feed} scope={data.scope} />
	{:else}
		<ErrorState code={data.feedError ?? 'INTERNAL'} onRetry={() => void invalidateAll()} />
	{/if}
</div>

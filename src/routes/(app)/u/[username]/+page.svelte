<script lang="ts">
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import ProfileTabs from '$lib/components/profile/ProfileTabs.svelte'
	import PostGrid from '$lib/components/profile/PostGrid.svelte'
	import PageBar from '$lib/components/ui/PageBar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import { _ } from 'svelte-i18n'
	let { data, form } = $props()
</script>

<svelte:head><title>@{data.profile.username} · {$_('app.name')}</title></svelte:head>
<PageBar backTo="/" />
<div class="py-4 md:py-8">
	<ProfileHeader profile={data.profile} errorCode={form?.error?.code ?? null} />
	<ProfileTabs type={data.type} isMe={data.profile.viewer.isMe} />
	{#if data.type === 'bookmarks' && !data.posts.items.length}
		<EmptyState title={$_('bookmarks.empty')} />
	{:else}
		<PostGrid posts={data.posts.items} />
	{/if}
	{#if data.type === 'bookmarks' && data.posts.nextCursor}
		<Button href="?type=bookmarks&cursor={encodeURIComponent(data.posts.nextCursor)}" class="mt-4"
			>{$_('feed.more')}</Button
		>
	{/if}
</div>

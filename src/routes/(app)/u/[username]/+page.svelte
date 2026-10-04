<script lang="ts">
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import ProfileTabs from '$lib/components/profile/ProfileTabs.svelte'
	import PostGrid from '$lib/components/profile/PostGrid.svelte'
	import { _ } from 'svelte-i18n'
	let { data, form } = $props()
</script>

<svelte:head><title>@{data.profile.username} · {$_('app.name')}</title></svelte:head>
<div class="py-4 md:py-8">
	<ProfileHeader profile={data.profile} errorCode={form?.error?.code ?? null} />
	<ProfileTabs type={data.type} isMe={data.profile.viewer.isMe} />
	<PostGrid posts={data.posts.items} />
</div>

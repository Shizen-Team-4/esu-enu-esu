<script lang="ts">
	import { _ } from 'svelte-i18n'
	import ProfileHeader from '$lib/components/ProfileHeader.svelte'
	import ProfileTabs from '$lib/components/ProfileTabs.svelte'
	import PostGrid from '$lib/components/PostGrid.svelte'
	let { data } = $props()
</script>

<svelte:head><title>{$_('nav.profile')} · {$_('app.name')}</title></svelte:head>
<div class="py-4">
	<ProfileHeader profile={data.profile} /><ProfileTabs type={data.type} /><PostGrid
		posts={data.posts.items}
	/>
</div>

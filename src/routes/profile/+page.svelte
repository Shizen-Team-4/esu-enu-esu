<script lang="ts">
	import ProfileHeader from '$lib/components/ProfileHeader.svelte'
	import ProfileTabs from '$lib/components/ProfileTabs.svelte'
	import PostGrid from '$lib/components/PostGrid.svelte'
	let { data } = $props()
</script>

<main class="container py-8" style="max-width: 935px">
	<ProfileHeader profile={data.profile} /><ProfileTabs type={data.type} /><PostGrid
		posts={data.posts.items}
	/>
</main>

<script lang="ts">
	import ProfileHeader from '$lib/components/ProfileHeader.svelte'
	import ProfileTabs from '$lib/components/ProfileTabs.svelte'
	import PostGrid from '$lib/components/PostGrid.svelte'
	import { _ } from 'svelte-i18n'
	import { errorMessageKey } from '$lib/errors/error-message'
	let { data, form } = $props()
</script>

<main class="container py-8" style="max-width: 935px">
	{#if form?.error?.code}<p role="alert">
			{$_(errorMessageKey(form.error.code))}
		</p>{/if}<ProfileHeader profile={data.profile} /><ProfileTabs type={data.type} /><PostGrid
		posts={data.posts.items}
	/>
</main>

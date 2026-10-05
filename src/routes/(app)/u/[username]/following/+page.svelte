<script lang="ts">
	import FollowListPage from '$lib/components/follows/FollowListPage.svelte'
	let { data, form } = $props()
</script>

<FollowListPage {...data} kind="following" {form} />

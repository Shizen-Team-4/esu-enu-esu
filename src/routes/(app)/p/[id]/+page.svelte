<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PostCard from '$lib/components/post/PostCard.svelte'
	let { data } = $props()
</script>

<svelte:head><title>@{data.post.author.username} · {$_('app.name')}</title></svelte:head>
<div class="grid gap-4 py-4">
	<PostCard post={data.post} editing={data.edit && data.post.viewer.isAuthor} />
</div>

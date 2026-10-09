<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PostComments from '$lib/components/comments/PostComments.svelte'
	let { data, form } = $props()
</script>

<svelte:head><title>@{data.post.author.username} · {$_('app.name')}</title></svelte:head>
{#key data.post.id}
	<PostComments
		post={data.post}
		comments={data.comments}
		me={data.me}
		{form}
		editing={data.edit && data.post.viewer.isAuthor}
	/>
{/key}

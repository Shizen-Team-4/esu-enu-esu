<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import type { Post } from '$lib/contract'
	import MediaCarousel from './MediaCarousel.svelte'
	import PostActions from './PostActions.svelte'
	import PostHeader from './PostHeader.svelte'

	let { post, editing = false }: { post: Post; editing?: boolean } = $props()
</script>

<article class="min-w-0 border-b border-line bg-surface max-md:border">
	<PostHeader {post} />
	{#if editing}
		<form id="post-edit-form" method="POST" action="?/edit" class="px-gutter py-3">
			<textarea
				name="caption"
				aria-label={$_('post.caption')}
				value={post.caption}
				class="field-sizing-content min-h-6 w-full resize-none border-0 bg-transparent p-0 text-body text-fg outline-none"
			></textarea>
		</form>
	{:else if post.caption}
		<p class="px-gutter py-3 text-body wrap-anywhere whitespace-pre-wrap">{post.caption}</p>
	{/if}
	{#if post.media.length}
		<div class:mt-3={!post.caption}>
			<MediaCarousel media={post.media} />
		</div>
	{/if}
	<PostActions {post} />
	{#if editing}
		<div class="flex justify-end gap-2 px-gutter py-3">
			<Button href="/p/{post.id}" variant="ghost">{$_('post.cancel')}</Button>
			<Button type="submit" form="post-edit-form" variant="primary">{$_('post.saveChanges')}</Button
			>
		</div>
	{/if}
</article>

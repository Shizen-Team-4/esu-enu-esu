<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	let { data } = $props()
</script>

<svelte:head><title>{$_('post.likedBy')} · {$_('app.name')}</title></svelte:head>
<section class="mx-auto max-w-xl px-gutter py-6">
	<a href="/p/{data.post.id}" class="text-sm text-fg-muted">← {$_('common.back')}</a>
	<h1 class="my-5 text-title font-semibold">{$_('post.likedBy')}</h1>
	{#if data.likers.items.length === 0}
		<p class="text-fg-muted">{$_('post.noLikes')}</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-line p-0">
			{#each data.likers.items as user (user.id)}
				<li>
					<a
						href="/u/{user.username}"
						class="flex min-h-16 items-center gap-3 text-fg no-underline"
					>
						<Avatar {user} />
						<span class="grid"
							><strong>{user.displayName}</strong><span class="text-sm text-fg-muted"
								>@{user.username}</span
							></span
						>
					</a>
				</li>
			{/each}
		</ul>
		{#if data.likers.nextCursor}
			<div class="py-6">
				<Button href="?cursor={encodeURIComponent(data.likers.nextCursor)}"
					>{$_('feed.more')}</Button
				>
			</div>
		{/if}
	{/if}
</section>

<script lang="ts">
	import { _, locale } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import type { Post } from '$lib/contract'
	import { relativeTime } from '$lib/format/relative-time'

	let { post }: { post: Post } = $props()
	let deleteDialogOpen = $state(false)
	const profileHref = $derived(`/u/${encodeURIComponent(post.author.username)}`)
	const when = $derived(relativeTime(post.createdAt, new Date(), $locale ?? 'en'))
</script>

<header class="flex items-center gap-3 px-gutter pt-3">
	<Avatar src={post.author.avatarUrl} name={post.author.displayName} />
	<div class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body">
		<a href={profileHref} class="truncate font-semibold text-fg no-underline"
			>{post.author.displayName}</a
		>
		<span class="text-meta text-fg-muted"
			>· <a href="/p/{post.id}" class="text-fg-muted no-underline"
				><time datetime={post.createdAt}>{when}</time></a
			></span
		>
		<a href={profileHref} class="truncate text-meta text-fg-muted no-underline"
			>@{post.author.username}</a
		>
	</div>
	{#if post.viewer.isAuthor}
		<details class="relative ml-auto shrink-0 self-start">
			<summary
				class="grid size-11 cursor-pointer list-none place-items-center rounded-xl text-fg-muted hover:bg-elevated [&::-webkit-details-marker]:hidden"
				aria-label={$_('post.moreActions')}
			>
				<svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
					<circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle
						cx="19"
						cy="12"
						r="1.5"
					/>
				</svg>
			</summary>
			<div
				class="absolute top-11 right-0 z-10 grid min-w-32 gap-1 border border-line bg-surface p-1"
			>
				<a
					href="/p/{post.id}?edit=1"
					class="px-3 py-2 text-body text-fg no-underline hover:bg-elevated">{$_('post.edit')}</a
				>
				<button
					type="button"
					onclick={() => (deleteDialogOpen = true)}
					class="w-full px-3 py-2 text-left text-body text-danger hover:bg-elevated"
					>{$_('post.delete')}</button
				>
			</div>
		</details>
	{/if}
</header>

{#if deleteDialogOpen}
	<div
		class="fixed inset-0 z-30 grid place-items-center bg-black/50 p-gutter"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) deleteDialogOpen = false
		}}
	>
		<div
			class="w-full max-w-sm border border-line bg-surface p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-post-title"
		>
			<h2 id="delete-post-title" class="m-0 text-title font-semibold">
				{$_('post.deleteTitle')}
			</h2>
			<p class="mt-2 mb-5 text-body text-fg-muted">{$_('post.deleteConfirm')}</p>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="min-h-11 cursor-pointer border border-line bg-transparent px-5 py-2 text-body text-fg hover:bg-elevated"
					onclick={() => (deleteDialogOpen = false)}>{$_('post.cancel')}</button
				>
				<form method="POST" action="/p/{post.id}?/delete">
					<button
						type="submit"
						class="min-h-11 cursor-pointer border border-danger bg-danger px-5 py-2 text-body text-white hover:opacity-90"
						>{$_('post.delete')}</button
					>
				</form>
			</div>
		</div>
	</div>
{/if}

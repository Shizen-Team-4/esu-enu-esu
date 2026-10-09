<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart'
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	import Avatar from '$lib/components/ui/Avatar.svelte'

	let {
		postId,
		activity,
		likeCount,
		reel = false,
	}: { postId: string; activity: Post['activity']; likeCount: number; reel?: boolean } = $props()
	const remaining = $derived(Math.max(0, likeCount - (activity?.likedBy.length ?? 0)))
</script>

{#if activity?.likedBy.length}
	<div class="inline-flex items-center gap-2" role="group" aria-label={$_('post.likedBy')}>
		<div class="relative flex items-center pr-1">
			{#each activity.likedBy as user (user.id)}
				<a
					href="/u/{user.username}"
					aria-label={user.displayName}
					class="-mr-2 inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					<Avatar {user} size={30} class="ring-2 {reel ? 'ring-black' : 'ring-surface'}" />
				</a>
			{/each}
			<span
				class="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 {reel
					? 'border-black'
					: 'border-surface'} bg-accent text-white"
				aria-hidden="true"><Heart size={11} fill="currentColor" /></span
			>
		</div>
		{#if remaining > 0}
			<a
				href="/p/{postId}/likes"
				aria-label={$_('post.moreLikes', { values: { count: remaining } })}
				class="ml-1 inline-flex min-h-8 items-center rounded-full px-2 text-sm font-semibold no-underline {reel
					? 'bg-white/20 text-white'
					: 'bg-elevated text-fg'}">+{remaining}</a
			>
		{/if}
	</div>
{/if}

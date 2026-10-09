<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	let { activity, reel = false }: { activity: Post['activity']; reel?: boolean } = $props()
</script>

{#if activity?.likedBy.length || activity?.commentedBy.length}
	<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs {reel ? 'text-white/80' : 'text-fg-muted'}">
		{#if activity?.likedBy.length}
			<p>
				{$_('post.likedBy')}
				{#each activity.likedBy as user, index (user.id)}{#if index > 0},
					{/if}<a class="font-medium {reel ? 'text-white' : 'text-fg'}" href="/u/{user.username}"
						>{user.displayName}</a
					>{/each}
			</p>
		{/if}
		{#if activity?.commentedBy.length}
			<p>
				{$_('post.commentedBy')}
				{#each activity.commentedBy as user, index (user.id)}{#if index > 0},
					{/if}<a class="font-medium {reel ? 'text-white' : 'text-fg'}" href="/u/{user.username}"
						>{user.displayName}</a
					>{/each}
			</p>
		{/if}
	</div>
{/if}
